import Redis from "ioredis";
import { callAmazonUpdateBudget } from "./amazon.js";
import { computeBackoffMs } from "./jitter.js";
import Budget from "../models/budget.js";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const GLOBAL_KEY = "global_qps";
const GLOBAL_QPS = 10;
const PROFILE_QPS = 2;

const batches = new Map();

function getBucketByProfile(profileId) {
  if (!batches.has(profileId)) {
    batches.set(profileId, { tokens: PROFILE_QPS, lastRefill: Date.now() });
  }
  return batches.get(profileId);
}

function refillBucketByProfile() {
  const now = Date.now();
  for (const bucket of batches.values()) {
    const elapsed = (now - bucket.lastRefill) / 1000;
    const add = Math.floor(elapsed * PROFILE_QPS);
    if (add > 0) {
      bucket.tokens = Math.min(PROFILE_QPS, bucket.tokens + add);
      bucket.lastRefill = now;
    }
  }
}

async function globalConsumption(count = 1) {
    const key = "global_qps";
    const current = await redis.incrby(key, count);
    if (current === count) {
      await redis.expire(key, 1); // reset every second
    }
    return current <= GLOBAL_QPS;
}

async function worker() {
    refillBucketByProfile();
  
    const availableDocs = await Budget.find({ status: "pending", next_attempt_at: {$lt: new Date()}})
      .limit(100)
      .lean();

    if (!availableDocs.length) return;
  
    const groups = new Map();
    for (const d of availableDocs) {
      if (!groups.has(d.profileId)) groups.set(d.profileId, []);
      groups.get(d.profileId).push(d);
    }
  
    const finalBatch = [];
    let remainingGlobal = GLOBAL_QPS;
  
    for (const [profileId, docs] of groups.entries()) {
      if (remainingGlobal <= 0) break;
      const bucket = getBucketByProfile(profileId);
      if (bucket.tokens <= 0) continue;
  
      const allowed = Math.min(bucket.tokens, docs.length, 2, remainingGlobal);
      finalBatch.push(...docs.slice(0, allowed));
      bucket.tokens -= allowed;
      remainingGlobal -= allowed;
    }
  
    if (!finalBatch.length) return;
  
    const allowedGlobal = await globalConsumption(finalBatch.length);
    if (!allowedGlobal) return;
  
    const claimedDocs = [];
    for (const doc of finalBatch) {
      const claimed = await Budget.findOneAndUpdate(
        { _id: doc._id, status: "pending" },
        { $set: { status: "inflight", updatedAt: new Date() }, $inc: { attempts: 1 } },
        { new: true }
      ).lean();
      if (claimed) claimedDocs.push(claimed);
    }
  
    if (!claimedDocs.length) return;
  
    await Promise.all(claimedDocs.map(executeBudget));
}

async function executeBudget(doc) {
    try {
      const res = await callAmazonUpdateBudget(doc.profileId, doc.campaignId, doc.newDailyBudget);
  
      if (res.status === 200) {
        await Budget.updateOne(
          { _id: doc._id },
          { $set: { status: "applied", lastError: null } }
        );
      } else if (res.status === 429 || res.status >= 500) {
        const delay = computeBackoffMs(doc.attempts);
        await Budget.updateOne(
          { _id: doc._id },
          { $set: { status: "pending", next_attempt_at: new Date(Date.now() + delay), lastError: `Status ${res.status}` } }
        );
      } else {
        await Budget.updateOne(
          { _id: doc._id },
          { $set: { status: "failed", lastError: `Status ${res.status}` } }
        );
      }
    } catch (err) {
      const delay = computeBackoffMs(doc.attempts);
      await Budget.updateOne(
        { _id: doc._id },
        { $set: { status: "pending", lastError: err.message } }
      );
    }
}
  
export function initWorker() {
    setInterval(worker, 500);
}
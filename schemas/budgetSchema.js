const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    profile_id: {type: String, required: true},
    campaign_id: {type: String, required: true},
    new_daily_budget: {type: Number, required: true},
    idempotent_key: {type: String},
    status: { type: String, enum: ["pending", "inflight", "applied", "failed"], default: "pending", index: true },
    attempts: { type: Number, default: 0 },
    last_error: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
    next_attempt_at: {type: Date, default: Date.now}
});

budgetSchema.index({ idempotent_key: 1 });

module.exports = budgetSchema;
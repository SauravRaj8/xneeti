const mongoose = require('mongoose');
let budgetSchema = require('../schemas/budgetSchema.js');

budgetSchema.statics.createBudgetData = async function(params, idempotentKey) {
    if(!params?.length)  return new Error('Campaign data is required');

    let requestIds = [];
    for(let i=0;i<params.length;i++){
        const campaignId = params[i].campaignId;
        const doc = await Budget.findOneAndUpdate(
            { campaign_id: campaignId },
            {
              $set: { newDailyBudget: params[i].newDailyBudget },
              $setOnInsert: {
                profile_id: params[i].profileId,
                new_daily_budget: params[i].newDailyBudget,
                status: "pending",
                attempts: 0,
                createdAt: new Date(),
                idempotent_key: idempotentKey
              },
            },
            {
              upsert: true,
              new: true, 
              setDefaultsOnInsert: true,
            }
        );
        requestIds.push({campaignId, requestId: doc._id});
    }
    return requestIds;
};

const Budget = mongoose.model("Budget", budgetSchema);

module.exports = Budget;
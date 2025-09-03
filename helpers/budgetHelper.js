let budgetHelper = {
    parseBudgetData: function(params) {
        if(!params || !params?.length)  return;

        let requestIds = [];
        for(let i=0;i<params.length;i++){
            let key = params[i].campaign_id;
            let value = params[i]._id;
            requestIds.push({campaignId: key, requestId: value });
        }
        return requestIds;
    }
}

module.exports = budgetHelper;
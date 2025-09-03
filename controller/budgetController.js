const Budget = require('../models/budget.js');
const BudgetHelper = require('../helpers/budgetHelper.js');

let budgetController = {
    validateRequest: async function(req, res, next) {
        let idempotentKey = req.headers['x-idempotency-key'];
        if (!idempotentKey) return res.status('404').json({ message: 'Idempotent key is required' });

        const dataExists = await Budget.find({idempotent_key: idempotentKey});
        if(dataExists?.length > 0) {
            let response = BudgetHelper.parseBudgetData(dataExists);
            return res.json(response);
        }
        next();
    },

    createBudgetData: async function(req, res, next) {
        let campaignData = req.body.campaigns;
        const idempotentKey = req.headers['x-idempotency-key'];

        let response = await Budget.createBudgetData(campaignData, idempotentKey);
        res.json(response);
        next();
    },

    getBudgetData: async function(req, res, next) {
        let id = req.query.requestId;

        const doc = await Budget.findOne({_id: id});
        if(!doc)    res.status(404).json({error: "No data found for the given id"});

        res.json({
            requestId: doc._id,
            status: doc.status,
            attempts: doc.attempts,
            lastError: doc.lastError,
            createdAt: doc.createdAt
        });
    }
}

module.exports = budgetController;
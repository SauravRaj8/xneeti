
const express = require('express');
const route = express.Router();

const budgetController = require('./../../controller/budgetController.js');

route.post('/api/v1/budget-changes', budgetController.validateRequest, budgetController.createBudgetData);

route.post('/api/v1/budget-changes/:requestId', budgetController.getBudgetData);

module.exports = route;
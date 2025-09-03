const express = require('express');
const bodyParser = require('body-parser');
const mongo = require('mongoose');

const app = express();
const budgetRoute = require('./routes/v1/budget');
const {initWorker} = require('./services/worker.js');

app.use(bodyParser.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/metrics', (req, res) => {
    res.json({ metrics: 'metrics' });
});

app.use(budgetRoute);

const port = process.env.PORT || 3000;
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/admin";

mongo.connect(mongoUrl)
    .then(() => {
        console.log("Mongo database connected successfully....");
        app.listen(port, () => console.log(`Server running on port ${port}`));
        initWorker();
    })
    .catch(err => console.error(err));
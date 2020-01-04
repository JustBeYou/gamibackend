const loadFunctions = require('firebase-function-tools');
const functions = require('firebase-functions');
const cors = require('cors');
const bodyParser = require('body-parser');
const express = require('express');
const permissions = require('./permissions');


const loggerOutput = console;
function logger(req, res, next) {
    loggerOutput.log(req.method, req.originalUrl);
    next();
}

loadFunctions(__dirname, exports, '.func.js', func => {
    // register middlewares to all functions
    const app = express();

    app.use(logger);
    app.use(cors());
    app.use(bodyParser.json());
    app.use(permissions.middleware);
    app.use(func);

    return functions.https.onRequest(app);
});

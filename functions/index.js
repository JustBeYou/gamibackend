const loadFunctions = require('firebase-function-tools');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');
const express = require('express');

const config = functions.config().firebase;

const loggerOutput = console;
function logger(req, res, next) {
    loggerOutput.log(req.method, req.originalUrl);
    next();
}

admin.initializeApp(config);
loadFunctions(__dirname, exports, '.func.js', func => {
    // register middlewares to all functions
    const app = express();

    app.use(logger);
    app.use(cors());
    app.use(bodyParser.json());
    app.use(func);

    return functions.https.onRequest(app);
});

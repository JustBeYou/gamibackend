const chai = require('chai');
const permissions = require('../permissions');
const express = require('express');
const loadedFunctions = require('../app_loader').loadedFunctions;
const bodyParser = require('body-parser');

function makeId(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const functionCache = {};

function loadStorageFunction(name) {
    return loadedFunctions['storage'][name];
}

function loadHttpFunction(name) {
    if (name in functionCache) return functionCache[name];

    const app = express();
    app.use(bodyParser.json());
    app.use(permissions.middleware);
    app.use(loadedFunctions['http'][name]);

    functionCache[name] = app;

    return functionCache[name];
}

function doFunctionRequest(name, customPath = '/') {
    const appFunction = loadHttpFunction(name);
    const requestInProgress = chai.request(appFunction)
        .post(customPath)
        .type('json');

    requestInProgress.setAdminToken = setAdminToken;
    requestInProgress.setUserToken = setUserToken;
    return requestInProgress;
}

const adminToken = 'admin_token';
const userToken = 'user_token';

function setAdminToken() {
    this.set('token', adminToken);
    return this;
}

function setUserToken() {
    this.set('token', userToken);
    return this;
}
module.exports = {
    makeId,
    doFunctionRequest,
    loadStorageFunction,
    adminToken,
    userToken,
};
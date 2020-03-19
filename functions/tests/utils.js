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
    requestInProgress.setAccessCode = setAccessCode;
    requestInProgress.setDefaultPasword = setDefaultPasword;
    requestInProgress.setAnotherUserToken = setAnotherUserToken;
    return requestInProgress;
}

const adminToken = 'admin_token';
const userToken = 'user_token';
const anotherUserToken = 'another_user_token';
const defaultPassword = 'password123';

function setAdminToken() {
    this.set('token', adminToken);
    return this;
}

function setUserToken() {
    this.set('token', userToken);
    return this;
}

function setAnotherUserToken() {
    this.set('token', anotherUserToken);
    return this;
}

function setDefaultPasword() {
    this.set('code', defaultPassword);
    return this;
}

function setAccessCode(code) {
    this.set('code', code);
    return this;
}

module.exports = {
    makeId,
    doFunctionRequest,
    loadStorageFunction,
    adminToken,
    userToken,
    anotherUserToken,
    defaultPassword,
    setDefaultPasword,
    setAccessCode,
    setAnotherUserToken,
};
const database = require('../database');
const {Sequelize} = require('sequelize');
const {initializeIdentifierTables} = require('../models/identifier');
const {initializeCollectionTables} = require('../models/collection');
const {initializeModuleTables} = require('../models/module');
const {initializeFileInfoTables} = require('../models/fileInfo');
const express = require('express');
const storage = require('../storage');
const concat = require('concat-stream');
const utils = require('./utils');

class TestingDatabase {
    constructor() {
        this.dbConnection = new Sequelize('sqlite::memory:', {
            logging: false,
        });
    }

    getConnectionObject() {
        return this.dbConnection;
    }

    executeTransaction(callback) {
        return this.dbConnection.transaction(callback);
    }
}

class TestingStorage {
    constructor() {
        this.storage = {};
        this.app = express();
        this.port = 1234;

        const router = express.Router();
        router.post('/resumable', async (req, res) => {
            if (req.header('Content-Type') === req.query.type) {
                this.storage[storage.getDefaultBucket()][req.query.file] = '';
                const signelURL = await this.getSignedURL(
                    storage.getDefaultBucket(),
                    req.query.file,
                    req.query.type,
                    'write',
                );
                res.set('Location', signelURL);
                res.json({status: 'ok'});
            } else {
                res.status(400).json({status: 'wrong type'});
            }
        });
        router.put('/write', async (req, res) => {
            if (req.header('Content-Type') === req.query.type) {
                this.storage[storage.getDefaultBucket()][req.query.file] += req.body.toString();
                const func = utils.loadStorageFunction('fileCreate');
                await func({
                    name: req.query.file, 
                    bucket: storage.getDefaultBucket(), 
                    size: req.body.toString().length,
                    contentType: req.query.type,
                });
                res.json({status: 'ok'});
            } else {
                res.status(400).json({status: 'wrong type'});
            }
        });        
        router.get('/read', (req, res) => {
            res.send(this.storage[storage.getDefaultBucket()][req.query.file]);
        });

        this.app.use(function(req, res, next){
            req.pipe(concat(function(data){
                req.body = data;
                next();
            }));
        });
        this.app.use(router);
        this.server = this.app.listen(this.port);
    }

    createBucket(bucketName) {
        this.storage[bucketName] = {};

        return Promise.resolve();
    }

    getSignedURL(bucketName, fileName, fileType, action) {
        const url = `http://localhost:${this.port}/${action}?bucket=${bucketName}&file=${fileName}&type=${fileType}`;
        return Promise.resolve(url);
    }

    checkFileExists(bucketName, fileName) {
        if (fileName in this.storage[bucketName]) return Promise.resolve(true);
        return Promise.resolve(false);
    }

    checkBucketExists(bucketName) {
        if (bucketName in this.storage) return Promise.resolve(true);
        else Promise.resolve(false);
    }
}

before(async () => {
    console.log('Mocking thrid party services (database, storage, ...)');

    const mockDatabase = new TestingDatabase();
    database.setMainDatabase(mockDatabase);

    initializeIdentifierTables(mockDatabase);
    initializeFileInfoTables(mockDatabase);
    initializeModuleTables(mockDatabase);
    initializeCollectionTables(mockDatabase);
    await mockDatabase.getConnectionObject().sync({alter: true});

    const mockStorage = new TestingStorage();
    storage.setDefaultStorage(mockStorage);
    storage.setDefaultBucket('gamibackend_testbucket');
});

after(() => {
    const mockStorage = storage.getDefaultStorage();
    if (mockStorage instanceof TestingStorage) {
        mockStorage.server.close();
    }
});
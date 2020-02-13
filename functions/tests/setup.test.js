const database = require('../database');
const {Sequelize} = require('sequelize');
const {initializeIdentifierTables} = require('../models/identifier');
const {initializeCollectionTables} = require('../models/collection');
const {initializeModuleTables} = require('../models/module');

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

before(async () => {
    console.log('Mocking thrid party services (database, storage, ...)');

    const mockDatabase = new TestingDatabase();
    database.setMainDatabase(mockDatabase);

    initializeIdentifierTables(mockDatabase);
    initializeModuleTables(mockDatabase);
    initializeCollectionTables(mockDatabase);
    await mockDatabase.dbConnection.sync({alter: true});

    console.log('End-to-end tests only');
});
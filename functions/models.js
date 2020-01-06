const {Sequelize, Model, DataTypes} = require('sequelize');
const dbConnection = new Sequelize('gami', 'gami', 'qwerty123456', {
    host: '35.233.1.255',
    port: 3306,
    dialect: 'mysql',
});

// createdAt, updatedAt, deletedAt are created by default

// Identifier tables
const identifierModel = {
    key: DataTypes.TEXT,
    parentToken: DataTypes.UUID,
    behavior: DataTypes.STRING,
    inactive: DataTypes.BOOLEAN,

    updatedByToken: DataTypes.UUID,
    deletedByToken: DataTypes.UUID,
};
class Identifier extends Model {};
Identifier.init(identifierModel,
    {
        sequelize: dbConnection,
        modelName: 'identifier',
    }
);
class IdentifierDeleted extends Model {};
IdentifierDeleted.init(identifierModel,
    {
        sequelize: dbConnection,
        modelName: 'identifier_deleted',
    }
);


// Module tables
const moduleModel = {
    index: DataTypes.INTEGER,

};
class Module extends Model {};
Module.init(moduleModel,
    {
        sequelize: dbConnection,
        modelName: 'module',
    }
);

// Collection tables
const collectionModel = {
    title: DataTypes.STRING,
    summary: DataTypes.TEXT,
    thumbnail: DataTypes.STRING, // TODO: change this

    // public, private (with password or access code)
    accessStatus: DataTypes.STRING,
    password: DataTypes.STRING,

    // TODO: design access codes
};
class Collection extends Model {};
Collection.init(collectionModel,
    {
        sequelize: dbConnection,
        modelName: 'collection',
    }
);

module.exports = {
    sequelize: dbConnection,
};

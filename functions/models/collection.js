const {Model, DataTypes} = require('sequelize');
const {dbConnection} = require('../config.js');

const collectionModel = {
    title: DataTypes.STRING,
    summary: DataTypes.TEXT,
    thumbnail: DataTypes.STRING, // TODO: change this

    // PUBLIC, PRIVATE
    accessStatus: DataTypes.STRING,
    // PASSWORD, ACCESS_CODE
    protectionType: DataTypes.STRING,
    password: DataTypes.STRING,
};
class Collection extends Model {}
Collection.init(collectionModel,
    {
        sequelize: dbConnection,
        modelName: 'collection',
    },
);

module.exports = {
    Collection,
};

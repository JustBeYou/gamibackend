const {Model, DataTypes} = require('sequelize');
const {dbConnection} = require('../config.js');
const {Module} = require('./module.js');

const collectionModel = {
    title: DataTypes.STRING,
    summary: DataTypes.TEXT,
    thumbnail: DataTypes.STRING, // TODO: change this

    parentToken: DataTypes.UUID,
    updatedByToken: DataTypes.UUID,
    // PUBLIC, PRIVATE
    accessStatus: DataTypes.STRING,
    // PASSWORD, ACCESS_CODE
    protectionType: DataTypes.STRING,
    password: DataTypes.STRING,

    accessConfiguration: DataTypes.TEXT,

    moduleCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },

    deletedAt: DataTypes.DATE,
    deletedByToken: DataTypes.UUID,
    inactive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
};
class Collection extends Model {}
Collection.init(collectionModel,
    {
        sequelize: dbConnection,
        modelName: 'Collection',
    },
);

Collection.hasMany(Module);
Module.belongsTo(Collection);

module.exports = {
    Collection,
};

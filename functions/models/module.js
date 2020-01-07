const {Model, DataTypes} = require('sequelize');
const {dbConnection} = require('../config.js');

const moduleModel = {
    index: DataTypes.INTEGER,

};
class Module extends Model {}
Module.init(moduleModel,
    {
        sequelize: dbConnection,
        modelName: 'module',
    },
);

module.exports = {
    Module,
};

const {Model, DataTypes} = require('sequelize');
const {dbConnection} = require('../config.js');

const fileInfoModel = {};
class FileInfo extends Model {}

module.exports = {
    FileInfo,
};
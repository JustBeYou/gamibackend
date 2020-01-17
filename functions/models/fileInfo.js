const {Model, DataTypes} = require('sequelize');
const {dbConnection} = require('../config.js');

const fileInfoModel = {
    path: DataTypes.STRING,
};
class FileInfo extends Model {}
FileInfo.init(fileInfoModel,
    {
        sequelize: dbConnection,
        modelName: 'FileInfo',
    },
);

module.exports = {
    FileInfo,
};
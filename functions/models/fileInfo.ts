import {Model/*, DataTypes*/} from 'sequelize';
//import {getMainDatabase} from '../database';

/*const fileInfoModel = {
   path: DataTypes.STRING,
};*/
class FileInfo extends Model {}
/*FileInfo.init(fileInfoModel,
    {
        sequelize: getMainDatabase().getConnectionObject(),
        modelName: 'FileInfo',
    },
);*/

module.exports = {
    FileInfo,
};
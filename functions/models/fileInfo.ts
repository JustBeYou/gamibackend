import {Model, DataTypes} from 'sequelize';
import { getMainDatabase, RelationalDatabase } from '../database';

const fileInfoModel = {
    bucket: DataTypes.STRING,
    path: DataTypes.STRING,
    filename: DataTypes.STRING,
    originalFilename: DataTypes.STRING,
    // TODO: what are derivations???
    extension: DataTypes.STRING,
    
    sizeInBytes: DataTypes.NUMBER,
    resolutionInPixels: DataTypes.NUMBER,
    timeDuration: DataTypes.NUMBER,
    FPS: DataTypes.NUMBER,
    processingRanking: DataTypes.NUMBER,
    estimatedProcessingTimeInMinutes: DataTypes.NUMBER,
    status: DataTypes.STRING,
    
    // TODO: 'utilizare' ???    
    parentToken: DataTypes.UUID,

    signedURL: DataTypes.STRING,
    isSignedURLValid: DataTypes.BOOLEAN,

    deleted: DataTypes.BOOLEAN,
};

export class FileInfoSchema extends Model {}

export class FileInfo extends FileInfoSchema {}

export function initializeFileInfoTable(database: RelationalDatabase) {
    FileInfo.init(fileInfoModel,
        {
            sequelize: getMainDatabase().getConnectionObject(),
            modelName: 'FileInfo',
        },
    );
}
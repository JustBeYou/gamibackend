import {Model, DataTypes} from 'sequelize';
import { RelationalDatabase } from '../database';

const fileInfoModel = {
    bucket: DataTypes.STRING,
    // TODO: add folder support maybe
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
    // NOT_PROCESSED, IN_QUEUE, PROCESSING, PROCESSED
    status: DataTypes.STRING,
    
    // TODO: 'utilizare' ???    
    parentToken: DataTypes.UUID,

    signedURL: DataTypes.STRING,
    isSignedURLValid: DataTypes.BOOLEAN,

    deleted: DataTypes.BOOLEAN,
    deletedByToken: DataTypes.UUID,
    deletedAt: DataTypes.DATE,
};
export class FileInfoSchema extends Model {
    public id!: number;

    public bucket!: string;
    public path!: string;
    public filename!: string;
    public originalFilename!: string;
    public extension!: string;

    public sizeInBytes!: number;
    public resolutionInPixels!: number;
    public timeDuration!: number;
    public FPS!: number;
    public processingRanking!: number;
    public estimatedProcessingTimeInMinutes!: number;
    public status!: string;

    public parentToken!: string;
    
    public signedURL!: string;
    public isSignedURLValid!: string;

    public deleted!: string;
    public deletedByToken!: string;
    
    public deletedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
export class FileInfo extends FileInfoSchema {}

export class FileInfoToModuleSchema extends Model {
    public ModuleId!: number;
    public FileInfoId!: number;
}
export class FileInfoToModule extends FileInfoToModuleSchema {}

export function initializeFileInfoTables(database: RelationalDatabase) {
    FileInfo.init(fileInfoModel,
        {
            sequelize: database.getConnectionObject(),
            modelName: 'FileInfo',
        },
    );

    FileInfoToModule.init({},
        {
            sequelize: database.getConnectionObject(),
            modelName: 'FileInfoToModule',
        }
    );
}
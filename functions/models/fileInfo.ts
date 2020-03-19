import {Model, DataTypes, Association} from 'sequelize';
import { RelationalDatabase } from '../database';
import { HasManyGetAssociationsMixin, 
    HasManyAddAssociationMixin, 
    HasManyHasAssociationMixin, 
    HasManyCountAssociationsMixin, 
    HasManyCreateAssociationMixin } from 'sequelize';

const fileInfoModel = {
    isOriginal: DataTypes.BOOLEAN,
    bucket: DataTypes.STRING,
    path: DataTypes.STRING,
    filename: DataTypes.STRING,
    originalFilename: DataTypes.STRING,
    extension: DataTypes.STRING,
    
    sizeInBytes: DataTypes.BIGINT,
    resolutionInPixels: DataTypes.BIGINT,
    // PORTRAIT, LANDSCAPE, IGNORED
    orientation: DataTypes.STRING,

    // TODO: set this in client VM
    timeDuration: DataTypes.INTEGER,
    FPS: DataTypes.INTEGER,
    processingRanking: DataTypes.INTEGER,
    estimatedProcessingTimeInMinutes: DataTypes.INTEGER,

    // NOT_PROCESSED, IN_QUEUE, PROCESSING, PROCESSED, ORIGINAL
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

    public isOriginal!: boolean;
    public bucket!: string;
    public path!: string;
    public filename!: string;
    public originalFilename!: string;
    public extension!: string;

    public sizeInBytes!: number;
    public resolutionInPixels!: number;
    public orientation!: string;
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

    public static associations: {
        FileInfos: Association<FileInfoSchema, FileInfo>,
    };

    public readonly fileInfos?: FileInfo[];

    public getFileInfos!: HasManyGetAssociationsMixin<FileInfo>;
    public addFileInfo!: HasManyAddAssociationMixin<FileInfo, number>;
    public hasFileInfo!: HasManyHasAssociationMixin<FileInfo, number>;
    public countFileInfos!: HasManyCountAssociationsMixin;
    public createFileInfo!: HasManyCreateAssociationMixin<FileInfo>;
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

    FileInfo.hasMany(FileInfo);
}
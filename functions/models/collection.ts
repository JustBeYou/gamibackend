import {Model, DataTypes, Association} from 'sequelize';
import {RelationalDatabase} from '../database';
import {Module, ModuleSchema} from './module';

const collectionModel = {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    summary: DataTypes.TEXT,
    thumbnail: DataTypes.STRING, // TODO: change this

    parentToken: DataTypes.UUID,
    updatedByToken: DataTypes.UUID,
    // PUBLIC, PRIVATE
    accessStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'PUBLIC',
    },
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

export class CollectionSchema extends Model {
    public id!: number;
    public title!: string;
    public summary!: string;
    public thumbnail!: string;
    public parentToken!: string;
    public updatedByToken!: string;
    public accessStatus!: string;
    public protectionType!: string;
    public password!: string;
    public accessConfiguration!: string;
    public moduleCount!: number;
    public deletedByToken!: string;
    public inactive!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public deletedAt!: Date;

    public static associations: {
        Modules: Association<CollectionSchema, ModuleSchema>,
    };
}

export class Collection extends CollectionSchema {}

export type CollectionUpdateSchema = {
    id: number,
    update: CollectionSchema,
};

export function initializeCollectionTables(database: RelationalDatabase) {
    Collection.init(collectionModel,
        {
            sequelize: database.getConnectionObject(),
            modelName: 'Collection',
        },
    );

    Collection.hasMany(Module);
    Module.belongsTo(Collection);
}
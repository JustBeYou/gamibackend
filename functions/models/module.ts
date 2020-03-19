import {Model, DataTypes, Association, Transaction} from 'sequelize';
import {RelationalDatabase} from '../database';
import { Collection } from './collection';
import { FileInfo, FileInfoToModule } from './fileInfo';
import { HasManyGetAssociationsMixin, 
    HasManyAddAssociationMixin, 
    HasManyHasAssociationMixin, 
    HasManyCountAssociationsMixin, 
    HasManyCreateAssociationMixin } from 'sequelize';

const moduleImageModel = {};
export class ModuleImageSchema extends Model {
    public id!: number;
}
export class ModuleImage extends ModuleImageSchema {}

const moduleVideoModel = {};
export class ModuleVideoSchema extends Model {
    public id!: number;
}
export class ModuleVideo extends ModuleVideoSchema {}

const moduleListModel = {
    icon: DataTypes.STRING,
    info: DataTypes.TEXT,
    links: DataTypes.TEXT,
};
export class ModuleListSchema extends Model {
    public id!: number;
    public icon!: string;
    public info!: string;
    public links!: string;
};
export class ModuleList extends ModuleListSchema {}


const moduleContactModel = {
    // JSON objects { name: content, ... }
    emails: DataTypes.TEXT,
    phoneNumbers: DataTypes.TEXT,
    addresses: DataTypes.TEXT,
};
export class ModuleContactSchema extends Model {
    public id!: number;
    public emails!: string;
    public phoneNumbers!: string;
    public addresses!: string;
}
export class ModuleContact extends ModuleContactSchema {}

const moduleTextModel = {
    text: DataTypes.TEXT,
};
export class ModuleTextSchema extends Model {
    public id!: number;
    public text!: string;
}
export class ModuleText extends ModuleTextSchema {}

export const classOfModuleType = {
    IMAGE: ModuleImage,
    VIDEO: ModuleVideo,
    LIST: ModuleList,
    CONTACT: ModuleContact,
    TEXT: ModuleText,
} as DynamicObject;

const moduleModel = {
    index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        //autoIncrement: true,
    },
    // IMAGE, VIDEO, LIST, CONTACT
    type: DataTypes.STRING,
    parentToken: DataTypes.UUID,

    updatedByToken: DataTypes.UUID,
    deletedByToken: DataTypes.UUID,

    deletedAt: DataTypes.DATE,
    inactive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
};

export class ModuleSchema extends Model {
    public id!: number;
    public CollectionId!: number;
    public index!: number;
    public type!: string;
    public parentToken!: string;
    public updatedByToken!: string;
    public deletedByToken!: string;
    public inactive!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public deletedAt!: Date;

    public static associations: {
        ModuleImage: Association<ModuleSchema, ModuleImage>,
        ModuleVideo: Association<ModuleSchema, ModuleVideo>,
        ModuleList: Association<ModuleSchema, ModuleList>,
        ModuleContact: Association<ModuleSchema, ModuleContact>,
        ModuleText: Association<ModuleSchema, ModuleText>,
        FileInfos: Association<ModuleSchema, FileInfo>,
    };

    public readonly fileInfos?: FileInfo[];

    public getFileInfos!: HasManyGetAssociationsMixin<FileInfo>;
    public addFileInfo!: HasManyAddAssociationMixin<FileInfo, number>;
    public hasFileInfo!: HasManyHasAssociationMixin<FileInfo, number>;
    public countFileInfos!: HasManyCountAssociationsMixin;
    public createFileInfo!: HasManyCreateAssociationMixin<FileInfo>;
};

export class Module extends ModuleSchema {
    static concreteCreate(baseModuleProperties: DynamicObject, concreteModuleProperties: DynamicObject, transaction: Transaction) {
        const moduleTypeClass = classOfModuleType[baseModuleProperties.type];

        if (moduleTypeClass === undefined) {
            throw new Error('unkown module type');
        }

        baseModuleProperties[moduleTypeClass.name] = concreteModuleProperties;
        const options = {
            include: moduleTypeClass,
            transaction,
        };

        return Module.create(baseModuleProperties, options);
    }

    static async typedCreate(
        baseModuleProperties: DynamicObject, 
        concreteModuleProperties: DynamicObject, 
        collectionRef: Collection, 
        transaction: Transaction) {
        
            const result = await Module.concreteCreate(baseModuleProperties, concreteModuleProperties, transaction);
        await collectionRef.update({
            moduleCount: collectionRef.moduleCount + 1,
        }, {
            transaction,
        });
        return result;
    }
}

export type ConcreteModuleSchema = ModuleImageSchema | ModuleVideoSchema | ModuleContactSchema |
                                   ModuleListSchema  | ModuleTextSchema;
export type ConcreteModule = ModuleImage | ModuleVideo | ModuleContact |
                             ModuleList  | ModuleText;

export type ModuleUpdateSchema = {
    id: number,
    update: ModuleSchema & ConcreteModuleSchema,
}

export function initializeModuleTables(database: RelationalDatabase) {
    ModuleList.init(moduleListModel,
        {
            sequelize: database.getConnectionObject(),
            modelName: 'ModuleList',
        },
    );

    ModuleVideo.init(moduleVideoModel,
        {
            sequelize: database.getConnectionObject(),
            modelName: 'ModuleVideo',
        },
    );

    ModuleImage.init(moduleImageModel,
        {
            sequelize: database.getConnectionObject(),
            modelName: 'ModuleImage',
        },
    );    

    ModuleText.init(moduleTextModel,
        {
            sequelize: database.getConnectionObject(),
            modelName: 'ModuleText',
        },
    );

    ModuleContact.init(moduleContactModel,
        {
            sequelize: database.getConnectionObject(),
            modelName: 'ModuleContact',
        },
    );
    
    Module.init(moduleModel,
        {
            sequelize: database.getConnectionObject(),
            modelName: 'Module',
        },
    );

    Module.hasOne(ModuleImage);
    ModuleImage.belongsTo(Module);

    Module.hasOne(ModuleVideo);
    ModuleVideo.belongsTo(Module);

    Module.hasOne(ModuleList);
    ModuleList.belongsTo(Module);

    Module.hasOne(ModuleContact);
    ModuleContact.belongsTo(Module);

    Module.hasOne(ModuleText);
    ModuleText.belongsTo(Module);

    FileInfo.belongsToMany(Module, {through: FileInfoToModule});
    Module.belongsToMany(FileInfo, {through: FileInfoToModule});
}
const {Model, DataTypes} = require('sequelize');
const {dbConnection} = require('../config.js');

const moduleImageModel = {};
class ModuleImage extends Model {}
ModuleImage.init(moduleImageModel,
    {
        sequelize: dbConnection,
        modelName: 'module_image',
    },
);

const moduleVideoModel = {};
class ModuleVideo extends Model {}
ModuleVideo.init(moduleVideoModel,
    {
        sequelize: dbConnection,
        modelName: 'module_video',
    },
);

const moduleListModel = {
    icon: DataTypes.STRING,
    info: DataTypes.TEXT,
    links: DataTypes.TEXT,
};
class ModuleList extends Model {}
ModuleList.init(moduleListModel,
    {
        sequelize: dbConnection,
        modelName: 'module_list',
    },
);

const moduleContactModel = {};
class ModuleContact extends Model {}
ModuleContact.init(moduleContactModel,
    {
        sequelize: dbConnection,
        modelName: 'module_contact',
    },
);

const moduleTextModel = {
    text: DataTypes.TEXT,
};
class ModuleText extends Model {}
ModuleText.init(moduleTextModel,
    {
        sequelize: dbConnection,
        moduleName: 'module_text',
    },
);

const classOfModuleType = {
    IMAGE: ModuleImage,
    VIDEO: ModuleVideo,
    LIST: ModuleList,
    CONTACT: ModuleContact,
    TEXT: ModuleText,
};

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
};
class Module extends Model {
    static async concreteCreate(baseModuleProperties, concreteModuleProperties) {
        const moduleTypeClass = classOfModuleType[baseModuleProperties.type];

        if (moduleTypeClass === undefined) {
            throw new Error('unkown module type');
        }

        baseModuleProperties[moduleTypeClass.name] = concreteModuleProperties;
        console.log(baseModuleProperties);
        const result = await Module.create(
            baseModuleProperties,
            {
                include: moduleTypeClass
            }
        );
        return result;
    }

    static async typedCreate(baseModuleProperties, concreteModuleProperties, collectionRef) {
        const result = await Module.concreteCreate(baseModuleProperties, concreteModuleProperties);
        await collectionRef.update({
            moduleCount: collectionRef.moduleCount + 1,
        });
        return result;
    }
}
Module.init(moduleModel,
    {
        sequelize: dbConnection,
        modelName: 'module',
    },
);

Module.hasOne(ModuleImage);
Module.hasOne(ModuleVideo);
Module.hasOne(ModuleList);
Module.hasOne(ModuleContact);
Module.hasOne(ModuleText);

module.exports = {
    Module,
    ModuleImage,
    ModuleVideo,
    ModuleList,
    ModuleContact,
    classOfModuleType,
};

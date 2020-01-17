const {Model, DataTypes} = require('sequelize');
const {dbConnection} = require('../config.js');

const moduleImageModel = {};
class ModuleImage extends Model {}
ModuleImage.init(moduleImageModel,
    {
        sequelize: dbConnection,
        modelName: 'ModuleImage',
    },
);

const moduleVideoModel = {};
class ModuleVideo extends Model {}
ModuleVideo.init(moduleVideoModel,
    {
        sequelize: dbConnection,
        modelName: 'ModuleVideo',
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
        modelName: 'ModuleList',
    },
);

const moduleContactModel = {
    // You have on field for storing the default contact info
    // For additional entries, you'll add then into another table (ModelContactEntry)
    defaultPhone: DataTypes.STRING,
    defaultPhoneName: DataTypes.STRING,

    defaultAddress: DataTypes.STRING,
    defaultAddressName: DataTypes.STRING,

    defaultEmail: DataTypes.STRING,
    defaultEmailName: DataTypes.STRING,
};
class ModuleContact extends Model {}
ModuleContact.init(moduleContactModel,
    {
        sequelize: dbConnection,
        modelName: 'ModuleContact',
    },
);

const moduleContactEntryModel = {
    // PHONE, EMAIL, ADDRESS
    type: DataTypes.STRING,
    name: DataTypes.STRING,
    content: DataTypes.STRING,
};
class ModuleContactEntry extends Model {}
ModuleContactEntry.init(moduleContactEntryModel,
    {
        sequelize: dbConnection,
        modelName: 'ModuleContactEntry',
    },
);

const moduleTextModel = {
    text: DataTypes.TEXT,
};
class ModuleText extends Model {}
ModuleText.init(moduleTextModel,
    {
        sequelize: dbConnection,
        moduleName: 'ModuleText',
    },
);

const classOfModuleType = {
    IMAGE: ModuleImage,
    VIDEO: ModuleVideo,
    LIST: ModuleList,
    CONTACT: ModuleContact,
    TEXT: ModuleText,
};

const subAssociationsOfModuleType = {
    IMAGE: ModuleImage,
    VIDEO: ModuleVideo,
    LIST: ModuleList,
    CONTACT: {
        model: ModuleContact,
        include: ModuleContactEntry,
    },
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
    deletedByToken: DataTypes.UUID,

    deletedAt: DataTypes.DATE,
    inactive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
};
class Module extends Model {
    static concreteCreate(baseModuleProperties, concreteModuleProperties, transaction) {
        const moduleTypeClass = classOfModuleType[baseModuleProperties.type];

        if (moduleTypeClass === undefined) {
            throw new Error('unkown module type');
        }

        baseModuleProperties[moduleTypeClass.name] = concreteModuleProperties;
        const options = {
            include: subAssociationsOfModuleType[baseModuleProperties.type],
            transaction,
        };

        return Module.create(baseModuleProperties, options);
    }

    static async typedCreate(baseModuleProperties, concreteModuleProperties, collectionRef, transaction) {
        const result = await Module.concreteCreate(baseModuleProperties, concreteModuleProperties, transaction);
        await collectionRef.update({
            moduleCount: collectionRef.moduleCount + 1,
        }, {
            transaction,
        });
        return result;
    }
}
Module.init(moduleModel,
    {
        sequelize: dbConnection,
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

ModuleContact.hasMany(ModuleContactEntry);
ModuleContactEntry.belongsTo(ModuleContact);

module.exports = {
    Module,
    ModuleImage,
    ModuleVideo,
    ModuleList,
    ModuleContact,
    ModuleContactEntry,
    classOfModuleType,
    subAssociationsOfModuleType,
};

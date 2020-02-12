import {Model, DataTypes, Transaction} from 'sequelize';
import {RelationalDatabase} from '../database';

// createdAt, updatedAt, deletedAt are created by default

// TODO: unique attribute is not working, Sequelize bug
const identifierModel = {
    key: {
        type: DataTypes.TEXT,
        unique: true,
        allowNull: false,
        validate: {
            is: /https:\/\/gamiworld.com\/share\/([a-zA-Z0-9\-_]{5,})/gi,
        },
    },
    parentToken: DataTypes.UUID,
    // RANDOMIZER, CYCLIC, SINGLE, CHRONO, RESERVED
    behavior: DataTypes.STRING,

    logic: DataTypes.STRING,

    updatedByToken: DataTypes.UUID,
    deletedByToken: DataTypes.UUID,
    deletedAt: DataTypes.DATE,
};

// TODO: decide where to store object logic (MySQL column now, Firestore in the future maybe)
// for the moment object logic is stored inside a column in the Identifier object (JSON string)
// maybe it's better to store it inside firestore
function getLogicObject(reference: Identifier) {
    return JSON.parse(reference.get('logic'));
}

/*
 * logicObject possible fields:
 * assocCollections = Array
 * currIndex = Integer
 * timeSched = Array of Objects {startTime, EndTime, index}
 */

type Schedule = {
    startTime: number,
    endTime: number,
    index: number,
}

export type CollectionId = number;
type IdentifierLogic = {
    assocCollections: Array<CollectionId>,
    currIndex?: number,
    timeSched?: Array<Schedule>,    
};

type CollectionGetter = (logic: IdentifierLogic) => number | null;
type CollectionGettersArray = {
    [key: string]: CollectionGetter,
};

const collectionGetters: CollectionGettersArray = {
    RANDOMIZER: (logic: IdentifierLogic) => {
        return logic.assocCollections[Math.floor(Math.random() * logic.assocCollections.length)];
    },

    CYCLIC: (logic: IdentifierLogic) => {
        const toReturn = logic.assocCollections[logic.currIndex!];
        logic.currIndex!++;
        logic.currIndex! %= logic.assocCollections.length;
        return toReturn;
    },

    SINGLE: (logic: IdentifierLogic) => {
        return logic.assocCollections[0];
    },

    CHRONO: (logic: IdentifierLogic) => {
        const currTime = Date.now();
        for (const time of logic.timeSched!) {
            if (time.startTime <= currTime && currTime <= time.endTime) {
                return logic.assocCollections[time.index];
            }
        }
        return null;
    },

    RESERVED: () => {
        return null;
    },
};

export class IdentifierSchema extends Model {
    public id!: number;
    public key!: string;
    public parentToken!: string;
    public behavior!: string;
    public logic!: string;
    public updatedByToken!: string;
    public deletedByToken!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public deletedAt!: Date; // manually managed
};

export type IdentifierUpdateSchema = {
    id: number,
    update: IdentifierSchema,
}

export class Identifier extends IdentifierSchema {
    static getCollection(reference: Identifier | null) {
        if (reference === null) return null;
        const logicObject = getLogicObject(reference);
        return collectionGetters[reference.behavior](logicObject);
    }

    static validateAndCreate(properties: IdentifierSchema, custom: boolean, token: string) {
        const validate = !custom;
        if (Array.isArray(properties)) {
            if (token !== undefined && token !== null) {
                for (const index in properties) {
                    properties[index].parentToken = token;
                }
            }

            return Identifier.bulkCreate(properties, {validate});
        }

        if (token !== undefined && token !== null) {
            properties.parentToken = token;
        }
        return Identifier.create(properties, {validate});
    }

    static async moveToTrash(reference: Identifier & DynamicObject, token: string, transaction: Transaction) {
        const identifierBackup = {} as DynamicObject;
        for (const key in identifierModel) {
            identifierBackup[key] = reference[key];
        }
        identifierBackup.deletedByToken = token;
        identifierBackup.deletedAt = new Date();

        await IdentifierDeleted.create(identifierBackup, {
            transaction,
        });

        await reference.destroy({transaction, force: true});
    }
}

export function initializeIdentifierTables(database: RelationalDatabase) {
    Identifier.init(identifierModel,
        {
            sequelize: database.getConnectionObject(),
            modelName: 'Identifier',
        },
    );

    IdentifierDeleted.init(identifierDeletedModel,
        {
            sequelize: database.getConnectionObject(),
            modelName: 'IdentifierDeleted',
        },
    );
}

const identifierDeletedModel = {...identifierModel};
// the key is not unique anymore
Object.assign(identifierDeletedModel, {key: DataTypes.STRING});

export class IdentifierDeleted extends IdentifierSchema {}


module.exports = {
    Identifier,
    IdentifierDeleted,
    identifierModel,
    initializeIdentifierTables,
};

const {Model, DataTypes} = require('sequelize');
const {dbConnection} = require('../config.js');

// createdAt, updatedAt, deletedAt are created by default

const identifierModel = {
    key: {
        type: DataTypes.TEXT,
        unique: true,
        validate: {
            is: /https:\/\/gamiworld.com\/share\/([a-zA-Z0-9\-_]{5,})/gi,
        },
    },
    parentToken: DataTypes.UUID,
    // RANDOMIZER, CYCLIC, SINGLE, CHRONO, RESERVED
    behavior: DataTypes.STRING,
    inactive: DataTypes.BOOLEAN,

    logic: DataTypes.STRING,

    updatedByToken: DataTypes.UUID,
    deletedByToken: DataTypes.UUID,
};

// TODO: decide where to store object logic (MySQL column now, Firestore in the future maybe)
// for the moment object logic is stored inside a column in the Identifier object (JSON string)
// maybe it's better to store it inside firestore
function getLogicObject(reference) {
    return JSON.parse(reference.get('logic'));
}

/*
 * logicObject possible fields:
 * assocCollections = Array
 * currIndex = Integer
 * timeSched = Array of Objects {startTime, EndTime, index}
 */

const collectionGetters = {
    RANDOMIZER: (logic) => {
        return logic.assocCollections[Math.floor(Math.random() * logic.assocCollections.length)];
    },

    CYCLIC: (logic) => {
        const toReturn = logic.assocCollections[logic.currIndex];
        logic.currIndex++;
        logic.currIndex %= logic.assocCollections.length;
        return toReturn;
    },

    SINGLE: (logic) => {
        return logic.assocCollections[0];
    },

    CHRONO: (logic) => {
        const currTime = Date.now();
        for (const time of logic.timeSched) {
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

class Identifier extends Model {
    static getCollection(reference) {
        if (reference === null) return null;
        const logicObject = getLogicObject(reference);
        return collectionGetters[reference.behavior](logicObject);
    }

    static modify(reference, properties, token) {
        if (Array.isArray(reference) && Array.isArray(properties)) {
            if (token !== undefined && token !== null) {
                for (const index in properties) {
                    properties[index].updatedByToken = token;
                }
            }

            for (const index in reference) {
                reference[index].update(properties[index]);
            }

            return ;
        }

        if (token !== undefined && token !== null) {
            properties.updatedByToken = token;
        }
        reference.update(properties);
    }

    static validateAndCreate(properties, custom, token) {
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

    static moveToTrash(reference, token) {
        // TODO: not sure how to implement deletion procedure
    }
}

Identifier.init(identifierModel,
    {
        sequelize: dbConnection,
        modelName: 'identifier',
    },
);
class IdentifierDeleted extends Model {}
IdentifierDeleted.init(identifierModel,
    {
        sequelize: dbConnection,
        modelName: 'identifier_deleted',
    },
);

module.exports = {
    Identifier,
    IdentifierDeleted,
};

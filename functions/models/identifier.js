const {Model, DataTypes, Op} = require('sequelize');
const {dbConnection} = require('../config.js');

// createdAt, updatedAt, deletedAt are created by default

const identifierModel = {
    key: {
        type: DataTypes.TEXT,
        validate: {
            is: /https:\/\/gamiworld.com\/share\/([a-zA-Z0-9\-\_]{5,})/gi,
        },
    },
    parentToken: DataTypes.UUID,
    // RANDOMIZER, CYCLIC, SINGLE, CHRONO, RESERVED
    behavior: DataTypes.STRING,
    inactive: DataTypes.BOOLEAN,

    updatedByToken: DataTypes.UUID,
    deletedByToken: DataTypes.UUID,
};

// TODO: implement getters
const collectionGetters = {
    RANDOMIZER: () => {
        return null;
    },

    CYCLIC: () => {
        return null;
    },

    SINGLE: () => {
        return null;
    },

    CHRONO: () => {
        return null;
    },

    RESERVED: () => {
        return null;
    },
};

class Identifier extends Model {
    static getCollection(refercence) {
        if (refercence === null) return null;
        return collectionGetters[refercence.behavior](refercence);
    }

    static modify(refercence, properties, token) {
        if (Array.isArray(refercence) && Array.isArray(properties)) {
            if (token !== undefined && token !== null) {
                for (let i = 0; i < properties.length; i++) {
                    properties[i].updatedByToken = token;
                }
            }

            for (let i = 0; i < reference.length; i++) {
                refercence[i].update(properties[i]);
            }

            return ;
        }

        if (token !== undefined && token !== null) {
            properties.updatedByToken = token;
        }
        refercence.update(properties);
    }

    static validateAndCreate(properties, custom, token) {
        const validate = !custom;
        if (Array.isArray(properties)) {
            if (token !== undefined && token !== null) {
                for (let i = 0; i < properties.length; i++) {
                    properties[i].parentToken = token;
                }
            }

            return Identifier.bulkCreate(properties, {validate});
        }

        if (token !== undefined && token !== null) {
            properties.parentToken = token;
        }
        return Identifier.create(properties, {validate});
    }

    static searchByToken(token) {
        return Identifier.findAll({
            where: {
                parentToken: token,
            },
        });
    }

    static searchByKey(key) {
        return Identifier.findAll({
            where: {
                key,
            },
        });
    }

    static searchByBehavior(behavior) {
        return Identifier.findAll({
            where: {
                behavior,
            },
        });
    }

    // alterationType - createdAt, updatedAt
    // TODO: implement for deletedAt
    static searchByTimestamp(alterationType, startTime, endTime) {
        return Identifier.findAll({
            where: {
                [`${alterationType}`]: {
                    [Op.and]: {
                        [Op.gte]: startTime,
                        [Op.lte]: endTime,
                    },
                },
            },
        });
    }

    static moveToTrash(reference, token) {
        // TODO: not sure how to implement this yet
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

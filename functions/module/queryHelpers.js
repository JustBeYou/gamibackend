const {Collection} = require('../models/collection.js');
const collectionErrorHandlers = require('../collection/errorHandlers.js');
const queryHelpers = require('../models/queryHelpers.js');

function parseQuery(query, currentToken, allowCustomToken) {
    let preparedQuery = queryHelpers.parseQuery(query, currentToken, allowCustomToken);

    const baseAttributes = [
        'index',
        'type',
        'parentToken',
        'updatedByToken',
        'createdAt',
        'updatedAt',
    ];
    const baseQuery = {where: {}};    
    for (attr of baseAttributes) {
        // TODO: = could be dangerous for Objects, find a better way to copy
        if (preparedQuery.where[attr] != undefined) {
            baseQuery.where[attr] = preparedQuery.where[attr];
            delete preparedQuery.where[attr];
        }
    }

    const finalQuery = {
        baseQuery,
        concreteQuery: preparedQuery,
    };
    return finalQuery;
}

function parseCreationData(properties, collectionRef) {
    let baseModuleProperties = {
        type: properties.type,
        index: collectionRef.moduleCount,
        collectionId: collectionRef.id,
        parentToken: collectionRef.parentToken,
    };
    let concreteModuleProperties = {...properties};
    delete concreteModuleProperties.type;
    delete concreteModuleProperties.collectionId;

    return {
        baseModuleProperties,
        concreteModuleProperties,
        collectionRef,
    };
}

async function parseAndValidateCreationData(properties, currentToken, isAdmin) {
    const collectionRef = await Collection.findOne({
        where: {
            id: properties.collectionId,
        },
    });
    collectionErrorHandlers.validateReference(collectionRef, currentToken, isAdmin);

    return parseCreationData(properties, collectionRef);
}

module.exports = {
    parseCreationData,
    parseAndValidateCreationData,
    parseQuery,
};
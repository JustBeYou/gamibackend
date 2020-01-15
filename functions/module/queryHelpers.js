const {Collection} = require('../models/collection.js');
const collectionErrorHandlers = require('../collection/errorHandlers.js');

function parseCreationData(properties, collectionRef) {
    let baseModuleProperties = {
        type: properties.type,
        index: collectionRef.moduleCount,
        collectionId: collectionRef.id,
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
};
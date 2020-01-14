const {Collection} = require('../models/collection.js');

function validateReference(reference, token, isAdmin) {
    if (reference === null) {
        throw new Error('Collection not found');
    }

    if (reference.parentToken !== token && !isAdmin) {
        throw new Error('not enough permissions');
    }
}

async function validateReferenceById(id, token, isAdmin) {
    const collectionRef = await Collection.findOne({
        where: {
            id,
        },
    });
    validateReference(collectionRef, token, isAdmin);
}

function validateImmutable(properties) {
    if (properties.id !== undefined) {
        throw new Error('id is immutable');
    }
}

module.exports = {
    validateReference,
    validateReferenceById,
    validateImmutable,
};

const {Identifier} = require('../models/identifier.js');

function validateReference(reference, token, isAdmin) {
    if (reference === null) {
        throw new Error('Identifier not found');
    }

    if (reference.parentToken !== token && !isAdmin) {
        throw new Error('not enough permissions');
    }
}

async function validateReferenceById(id, token, isAdmin) {
    const identifierRef = await Identifier.findOne({
        where: {
            id,
        },
    });
    validateReference(identifierRef, token, isAdmin);
}

function validateImmutable(properties) {
    if (properties.id !== undefined || properties.key !== undefined) {
        throw new Error('id and key are immutable');
    }
}

module.exports = {
    validateReference,
    validateReferenceById,
    validateImmutable,
};
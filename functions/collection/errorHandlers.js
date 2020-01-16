const {Collection} = require('../models/collection.js');
const passwordHash = require('password-hash');
const accessCodes = require('../accessCodes.js');

async function validatePermissions(reference, accessCode, token, isAdmin) {
    if (reference.parentToken === token || isAdmin) {
        return ;
    }

    if (reference.accessStatus === 'PUBLIC') {
        return ;
    }
    
    if (reference.protectionType === 'ACCESS_CODE') {
        await accessCodes.verifyAccessCode(reference, accessCode, token);
    } else if (reference.protectionType === 'PASSWORD') {
        if (passwordHash.validatePassword(accessCode, reference.password) === false) {
            throw new Error('invalid password');
        }
    }
}

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
    validatePermissions,
};
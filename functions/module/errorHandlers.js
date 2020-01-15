const permissions = require('../permissions.js');

const permissionsOfModuleType = {
    IMAGE: 'ITEM_IMAGES',
    VIDEO: 'ITEM_VIDEOS',
    LIST: 'ITEMS',
    TEXT: 'ITEMS',
    CONTACT: 'ITEMS',
};

function isAllowedToCreateModule(req, moduleType) {
    const hasPermission = permissions.check(req, permissionsOfModuleType[moduleType]);
    if (!hasPermission) {
        throw new Error('not enough permissions to create the module');
    }
}

function validateReference(reference, token, isAdmin) {
    if (reference === null) {
        throw new Error('Module not found');
    }

    if (reference.parentToken !== token && !isAdmin) {
        throw new Error('not enough permissions');
    }
}

function validateImmutable(properties) {
    if (properties.id !== undefined || properties.type !== undefined) {
        throw new Error('id and type are immutable');
    }
}

module.exports = {
    permissionsOfModuleType,
    isAllowedToCreateModule,
    validateReference,
    validateImmutable,
};
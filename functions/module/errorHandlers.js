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

module.exports = {
    permissionsOfModuleType,
    isAllowedToCreateModule,
};
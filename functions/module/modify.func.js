const express = require('express');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const {Module, classOfModuleType} = require('../models/module.js');
const moduleErrorHandlers = require('./errorHandlers.js');
const {dbConnection} = require('../config.js');

const router = express.Router();

// TODO: we can't modify tables that inherit concrete types
async function updateModule(id, properties, token, isAdmin, transaction) {
    const moduleRef = await Module.findOne({
        where: {
            id,
        },
        transaction: transaction,
    });

    moduleErrorHandlers.validateReference(moduleRef, token, isAdmin);
    moduleErrorHandlers.validateImmutable(properties);

    const moduleClass = classOfModuleType[moduleRef.type];
    const concreteModuleRef = await moduleClass.findOne({
        where: {
            moduleId: moduleRef.id,
        },
        transaction: transaction,
    });

    const concrete = await concreteModuleRef.update(properties, {transaction: transaction});
    const base = await moduleRef.update({
        updatedByToken: token,
    }, {transaction: transaction});


    return {base, concrete};
}

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyData,
    ],
    (req, res) => {
        const isAdmin = permissions.check(req, 'ADMIN_ITEMS');
        const currentToken = permissions.getReqToken(req);

        errorHandlers.safeResponse(res, async () => {
            const result = await dbConnection.transaction(async (transaction) => {
                return await updateModule(
                    req.body.data.id,
                    req.body.data.update,
                    currentToken,
                    isAdmin,
                    transaction,
                );
            });
            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;
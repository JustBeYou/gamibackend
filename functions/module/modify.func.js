const express = require('express');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const {Module, classOfModuleType} = require('../models/module.js');
const moduleErrorHandlers = require('./errorHandlers.js');

const router = express.Router();

async function updateModule(id, properties, token, isAdmin) {
    const moduleRef = await Module.findOne({
        where: {
            id: id,
        },
    });

    moduleErrorHandlers.validateReference(moduleRef, token, isAdmin);
    moduleErrorHandlers.validateImmutable(properties);

    const moduleClass = classOfModuleType[moduleRef.type];
    const concreteModuleRef = await moduleClass.findOne({
        where: {
            moduleId: moduleRef.id,
        }
    });

    const concrete = await concreteModuleRef.update(properties);
    const base = await moduleRef.update({
        updatedByToken: token,
    });


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
            const result = await updateModule(
                req.body.data.id,
                req.body.data.update,
                currentToken,
                isAdmin,
            );
            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;
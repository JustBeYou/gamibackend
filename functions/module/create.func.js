const express = require('express');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const {Module} = require('../models/module.js');
const {parseAndValidateCreationData} = require('./queryHelpers.js');
const {isAllowedToCreateModule} = require('./errorHandlers.js');
const {dbConnection} = require('../config.js');

const router = express.Router();

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyData,
    ],
    (req, res) => {
        const currentToken = permissions.getReqToken(req);
        const isAdmin = permissions.check(req, 'ADMIN_ITEMS');

        errorHandlers.safeResponse(res, async () => {
            const result = await dbConnection.transaction(async (transaction) => {
                const {
                    baseModuleProperties,
                    concreteModuleProperties,
                    collectionRef,
                } = await parseAndValidateCreationData(
                    req.body.data,
                    currentToken,
                    isAdmin,
                    transaction,
                );

                isAllowedToCreateModule(req, baseModuleProperties.type);

                const result = await Module.typedCreate(
                    baseModuleProperties,
                    concreteModuleProperties,
                    collectionRef,
                    transaction,
                );
                return result;
            });
            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;
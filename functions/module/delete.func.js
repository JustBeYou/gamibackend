const express = require('express');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const {dbConnection} = require('../config.js');
const moduleErrorHandlers = require('./errorHandlers.js');
const {Module} = require('../models/module.js');

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
            await dbConnection.transaction(async (transaction) => {
                const moduleRef = await Module.findOne({
                    where: {
                        id: req.body.data.id,
                    },
                    transaction,
                });

                moduleErrorHandlers.validateReference(moduleRef, currentToken, isAdmin);

                await moduleRef.update({
                    deletedByToken: currentToken,
                    deletedAt: Date.now(),
                    inactive: true,
                }, {transaction});
            });

            res.json({status: 'ok'});
        });
    },
);

module.exports = router;
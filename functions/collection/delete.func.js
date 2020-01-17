const express = require('express');
const permissions = require('../permissions.js');
const {Collection} = require('../models/collection.js');
const errorHandlers = require('../errorHandlers.js');
const {dbConnection} = require('../config.js');
const collectionErrorHandlers = require('./errorHandlers.js');

const router = express.Router();

// TODO: decide what to do with inactive entities

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
                const collectionRef = await Collection.findOne({
                    where: {
                        id: req.body.data.id,
                    },
                    transaction,
                });

                collectionErrorHandlers.validateReference(collectionRef, currentToken, isAdmin);

                await collectionRef.update({
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

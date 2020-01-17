const express = require('express');
const permissions = require('../permissions.js');
const {Identifier} = require('../models/identifier.js');
const errorHandlers = require('../errorHandlers.js');
const identifierErrorHandlers = require('./errorHandlers.js');
const {dbConnection} = require('../config.js');

const router = express.Router();

router.post(
    '/',
    [
        permissions.necessary(['IDENTIFIERS']),
        errorHandlers.requestEmptyData,
    ],
    (req, res) => {
        const currentToken = permissions.getReqToken(req);
        const isAdmin = permissions.check(req, 'ADMIN_IDENTIFIERS');

        errorHandlers.safeResponse(res, async () => {
            await dbConnection.transaction(async (transaction) => {
                const identifierRefs = await Identifier.findAll({
                    where: {
                        id: req.body.data.id,
                    },
                    transaction,
                });

                for (const identifierRef of identifierRefs) {
                    identifierErrorHandlers.validateReference(identifierRef, currentToken, isAdmin);
                    await Identifier.moveToTrash(identifierRef, currentToken, transaction);
                }
            });

            res.json({status: 'ok'});
        });
    },
);

module.exports = router;

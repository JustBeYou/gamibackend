const express = require('express');
const permissions = require('../permissions.js');
const {Identifier} = require('../models/identifier.js');
const errorHandlers = require('../errorHandlers.js');
const identifierErrorHandlers = require('./errorHandlers.js');

const router = express.Router();

async function updateIdentifier(id, properties, token, isAdmin) {
    const identifierRef = await Identifier.findOne({
        where: {
            id,
        },
    });

    identifierErrorHandlers.validateReference(identifierRef, token, isAdmin);
    identifierErrorHandlers.validateImmutable(properties);

    properties.updatedByToken = token;
    return identifierRef.update(properties);
}

async function updateIdentifierArray(array, token, isAdmin) {
    let result = [];
    for (const toUpdate of array) {
        result.push(await updateIdentifier(
            toUpdate.id,
            toUpdate.update,
            token,
            isAdmin,
        ));
    }
    return result;
}

router.post(
    '/',
    [
        permissions.necessary(['IDENTIFIERS']),
        errorHandlers.requestEmptyData,
    ],
    (req, res) => {
        const isAdmin = permissions.check(req, 'ADMIN_IDENTIFIERS');
        const currentToken = permissions.getReqToken(req);

        let result = null;
        errorHandlers.safeResponse(res, async () => {
            if (Array.isArray(req.body.data)) {
                result = await updateIdentifierArray(
                    req.body.data,
                    currentToken,
                    isAdmin,
                );
            }
            else {
                result = await updateIdentifier(
                    req.body.data.id,
                    req.body.data.update,
                    currentToken,
                    isAdmin,
                );
            }

            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;

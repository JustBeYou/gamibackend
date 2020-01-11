const express = require('express');
const permissions = require('../permissions.js');
const {Identifier} = require('../models/identifier.js');
const errorHandlers = require('../errorHandlers.js');

const router = express.Router();

async function updateIdentifier(id, properties, token, isAdmin) {
    const identifierRef = await Identifier.findOne({
        where: {
            id,
        },
    });

    if (identifierRef === null) {
        throw new Error('identifier not found');
    }

    if (identifierRef.parentToken !== token && !isAdmin) {
        throw new Error('not enough permissions');
    }

    if (properties.id !== undefined || properties.key !== undefined) {
        throw new Error('id and key are immutable');
    }

    properties.updatedByToken = token;
    return identifierRef.update(properties);
}

router.post(
    '/',
    [
        permissions.necessary(['IDENTIFIERS']),
        errorHandlers.requestEmptyData,
    ],
    async (req, res) => {
        const isAdmin = permissions.check(req, 'ADMIN_IDENTIFIERS');

        let result = null;
        errorHandlers.safeResponse(res, async () => {
            if (Array.isArray(req.body.data)) {
                result = [];
                for (const toUpdate of req.body.data) {
                    result.push(await updateIdentifier(
                        toUpdate.id,
                        toUpdate.update,
                        permissions.getReqToken(req),
                        isAdmin,
                    ));
                }
            }
            else {
                result = await updateIdentifier(
                    req.body.data.id,
                    req.body.data.update,
                    permissions.getReqToken(req),
                    isAdmin,
                );
            }

            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;

const express = require('express');
const permissions = require('../permissions.js');
const {Collection} = require('../models/collection.js');
const errorHandlers = require('../errorHandlers.js');

const router = express.Router();

async function updateCollection(id, properties, token, isAdmin) {
    const collectionRef = await Collection.findOne({
        where: {
            id,
        },
    });

    if (collectionRef === null) {
        throw new Error('collection not found');
    }

    if (collectionRef.parentToken != token && !isAdmin) {
        throw new Error('not enough permissions');
    }

    if (properties.id !== undefined) {
        throw new Error('id is immutable');
    }

    properties.updatedByToken = token;
    return collectionRef.update(properties);
}

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyData,
    ],
    async (req, res) => {
        const isAdmin = permissions.check(req, 'ADMIN_ITEMS');

        let result = null;
        errorHandlers.safeResponse(res, async () => {
            if (Array.isArray(req.body.data)) {
                result = [];
                for (const toUpdate of req.body.data) {
                    result.push(await updateCollection(
                        toUpdate.id,
                        toUpdate.update,
                        permissions.getReqToken(req),
                        isAdmin,
                    ));
                }
            }
            else {
                result = await updateCollection(
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

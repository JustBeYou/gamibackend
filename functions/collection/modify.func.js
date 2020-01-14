const express = require('express');
const permissions = require('../permissions.js');
const {Collection} = require('../models/collection.js');
const errorHandlers = require('../errorHandlers.js');
const collectionErrorHandlers = require('./errorHandlers.js');

const router = express.Router();

async function updateCollection(id, properties, token, isAdmin) {
    const collectionRef = await Collection.findOne({
        where: {
            id,
        },
    });

    collectionErrorHandlers.validateReference(collectionRef, token, isAdmin);
    collectionErrorHandlers.validateImmutable(properties);

    properties.updatedByToken = token;
    return collectionRef.update(properties);
}

async function updateCollectionArray(array, token, isAdmin) {
    let result = [];
    for (const toUpdate of array) {
        result.push(await updateCollection(
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
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyData,
    ],
    (req, res) => {
        const isAdmin = permissions.check(req, 'ADMIN_ITEMS');
        const currentToken = permissions.getReqToken(req);


        let result = null;
        errorHandlers.safeResponse(res, async () => {
            if (Array.isArray(req.body.data)) {
                result = await updateCollectionArray(
                    req.body.data,
                    currentToken,
                    isAdmin,
                );
            }
            else {
                result = await updateCollection(
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

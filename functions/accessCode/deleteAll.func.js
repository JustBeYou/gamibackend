const accessCodes = require('../accessCodes.js');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const express = require('express');
const {Collection} = require('../models/collection.js');

const router = express.Router();

async function parse(id, token, isAdmin) {
    const collectionRef = Collection.findOne({
        where: {
            id: id,
        },
    });

    if (collectionRef === null) {
        throw new Error('collection not found');
    }

    if (collectionRef.parentToken != token && !isAdmin) {
        throw new Error('not enough permissions');
    }
}

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyQuery,
    ],
    (req, res) => {
        const isAdmin = permissions.check(req, 'ADMIN_ITEMS');
        const token = permissions.getReqToken(req);

        errorHandlers.safeResponse(res, async () => {
            const collectionId = req.body.data.query.id;
            await parse(collectionId, token, isAdmin);
            await accessCodes.deleteAllAccessCodes(collectionId);
            res.json({status: 'ok'});
        });
    },
);

module.exports = router;

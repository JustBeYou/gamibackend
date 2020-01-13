const accessCodes = require('../accessCodes.js');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const express = require('express');
const {Collection} = require('../models/collection.js');

const router = express.Router();

async function parse(properties, token, isAdmin) {
    const collectionRef = await Collection.findOne({
        where: {
             id: properties.parentCollection,
        }
    });

    if (collectionRef === null) {
        throw new Error('Collection not found');
    }

    if (collectionRef.parentToken !== token && !isAdmin) {
        throw new Error('not enough permissions');
    }

    properties.parentCollection = collectionRef.id;
    return accessCodes.createAccessCode(properties);
}

async function parseArray(properties, token, isAdmin) {
    let result = [];
    for (const property of properties) {
        reslut.push(await parse(property, token, isAdmin));
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
        const token = permissions.getReqToken(req);

        errorHandlers.safeResponse(res, async () => {
            let result = null;
            if (Array.isArray(req.body.data)) {
                result = await parseArray(req.body.data, token, isAdmin);
            } else {
                result = await parse(req.body.data, token, isAdmin);
            }

            res.json({status: 'ok', result: result});
        });
    },
);

module.exports = router;

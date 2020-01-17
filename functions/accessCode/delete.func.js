const accessCodes = require('../accessCodes.js');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const express = require('express');
const {Collection} = require('../models/collection.js');
const collectionErrorHandlers = require('../collection/errorHandlers.js');

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
            const codeObj = await accessCodes.getAccessCode(req.body.data.code);
            const collectionRef = await Collection.findOne({
                where: {
                    id: codeObj.parentCollection,
                },
            });
            collectionErrorHandlers.validateReference(collectionRef, currentToken, isAdmin);
            accessCodes.modifyAccessCode(req.body.data.code, {type: 'INACTIVE'});

            res.json({status: 'ok'});
        });
    },
);

module.exports = router;

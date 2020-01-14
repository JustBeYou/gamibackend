const accessCodes = require('../accessCodes.js');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const express = require('express');
const collectionErrorHandlers = require('../collection/errorHandlers.js');

const router = express.Router();

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyQuery,
    ],
    (req, res) => {
        const isAdmin = permissions.check(req, 'ADMIN_ITEMS');
        const currentToken = permissions.getReqToken(req);

        errorHandlers.safeResponse(res, async () => {
            const collectionId = req.body.data.query.id;
            await collectionErrorHandlers.validateReferenceById(collectionId, currentToken, isAdmin);
            const result = await accessCodes.listAccessCodes(collectionId);
            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;

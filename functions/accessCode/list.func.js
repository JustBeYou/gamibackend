const accessCodes = require('../accessCodes.js');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const express = require('express');

const router = express.Router();

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyQuery,
    ],
    (req, res) => {
        const isAdmin = permissions.check(req, 'ADMIN_ITEMS');

        errorHandlers.safeResponse(res, async () => {
            const collectionId = req.body.data.query.id;
            const result = await accessCodes.listAccessCodes(collectionId);

            res.json({status: 'ok', result: result});
        });
    },
);

module.exports = router;

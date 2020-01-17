const accessCodes = require('../accessCodes.js');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const express = require('express');
const {Collection} = require('../models/collection.js');
const collectionErrorHandlers = require('../collection/errorHandlers.js');

const router = express.Router();

async function updateAccessCode(code, properties, currentToken, isAdmin) {
    const codeObj = await accessCodes.getAccessCode(code);
    const collectionRef = await Collection.findOne({
        where: {
            id: codeObj.parentCollection,
        },
    });
    collectionErrorHandlers.validateReference(collectionRef, currentToken, isAdmin);
    accessCodes.modifyAccessCode(code, properties);
}

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
            if (Array.isArray(req.body.data)) {
                for (const entry of req.body.data) {
                    await updateAccessCode(
                        entry.code,
                        entry.update,
                        currentToken,
                        isAdmin,
                    );
                }
            }
            else {
                await updateAccessCode(
                    req.body.data.code,
                    req.body.data.update,
                    currentToken, isAdmin,
                );
            }

            res.json({status: 'ok'});
        });
    },
);

module.exports = router;

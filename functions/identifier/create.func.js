const express = require('express');
const permissions = require('../permissions.js');
const {Identifier} = require('../models/identifier.js');
const errorHandlers = require('../errorHandlers.js');

const router = express.Router();

router.post(
    '/',
    [
        permissions.necessary(['IDENTIFIERS']),
        errorHandlers.requestEmptyData,
    ],
    async (req, res) => {
        const allowCustom = permissions.check(req, 'ADMIN_IDENTIFIERS') || permissions.check(req, 'CUSTOM_IDENTIFIERS');

        errorHandlers.safeResponse(res, async () => {
            const created = await Identifier.validateAndCreate(
                req.body.data,
                allowCustom,
                permissions.getReqToken(req),
            );
            res.json({status: 'ok', result: created});
        });
    },
);

module.exports = router;

const express = require('express');
const permissions = require('../permissions.js');
const {Identifier} = require('../models/identifier.js');

const router = express.Router();

router.post(
    '/',
    permissions.necessary(['IDENTIFIERS']),
    async (req, res) => {
        const allowCustom = permissions.check(req, 'ADMIN_IDENTIFIERS') || permissions.check(req, 'CUSTOM_IDENTIFIERS');

        if (req.body.data === undefined) {
            res.status(400).json({status: 'empty body'});
            return ;
        }

        try {
            const created = await Identifier.validateAndCreate(req.body.data, allowCustom, permissions.getReqToken(req));
            res.json({status: 'ok', result: created});
        }
        catch (error) {
            res.status(400).json({status: error.toString()});
        }
    }
);

module.exports = router;

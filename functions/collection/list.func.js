const express = require('express');
const permissions = require('../permissions.js');
const {Collection} = require('../models/collection.js');
const helpers = require('../models/helpers.js');

const router = express.Router();

router.post(
    '/',
    permissions.necessary([]),
    async (req, res) => {
        if (req.body.data === undefined || req.body.data.query === undefined) {
            res.status(400).json({status: 'empty body'});
            return ;
        }

        const allowCustomToken = permissions.check(req, 'ADMIN_ITEMS');

        let tokenFilter = permissions.getReqToken(req);
        if (allowCustomToken && req.body.data.token !== undefined) {
            tokenFilter = req.body.token;
        }

        try {
            const query = helpers.parseQuery(req.body.data.query, tokenFilter);

            const result = await Collection.findAll(query);
            res.json({status: 'ok', result: result});
        }
        catch (error) {
            res.status(400).json({status: error.toString()});
        }
    }
);

module.exports = router;

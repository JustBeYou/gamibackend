const express = require('express');
const permissions = require('../permissions.js');
const {Identifier} = require('../models/identifier.js');
const helpers = require('../models/helpers.js');

const router = express.Router();

// TODO: implement pagination
router.post(
    '/',
    permissions.necessary(['IDENTIFIERS']),
    async (req, res) => {
        if (req.body.data === undefined || req.body.data.query === undefined) {
            res.status(400).json({status: 'empty body'});
            return ;
        }

        const allowCustomToken = permissions.check(req, 'ADMIN_IDENTIFIERS');

        let tokenFilter = permissions.getReqToken(req);
        if (allowCustomToken && req.body.data.token !== undefined) {
            tokenFilter = req.body.token;
        }

        try {
            let query = {};
            if (Array.isArray(req.body.data.query)) {
                query = helpers.parseQueryArray(req.body.data.query, tokenFilter);
                let result = [];
                for (let i = 0; i < query.length; i++) {
                    result.push(await Identifier.findAll(query[i]));
                }
                res.json({status: 'ok', result: result});
            } else {
                query = helpers.parseQuery(req.body.data.query, tokenFilter);
                const result = await Identifier.findAll(query);
                res.json({status: 'ok', result: result});
            }
        }
        catch (error) {
            res.status(400).json({status: error.toString()});
        }
    }
);

module.exports = router;

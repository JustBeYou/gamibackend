const express = require('express');
const permissions = require('../permissions.js');
const {Identifier} = require('../models/identifier.js');
const queryHelpers = require('../models/queryHelpers.js');
const errorHandlers = require('../errorHandlers.js');

const router = express.Router();

// TODO: implement pagination
router.post(
    '/',
    [
        permissions.necessary(['IDENTIFIERS']),
        errorHandlers.requestEmptyQuery,
    ],
    async (req, res) => {
        const allowCustomToken = permissions.check(req, 'ADMIN_IDENTIFIERS');

        let tokenFilter = permissions.getReqToken(req);
        if (allowCustomToken && req.body.data.token !== undefined) {
            tokenFilter = req.body.token;
        }

        errorHandlers.safeResponse(res, async () => {
            let query = {};
            if (Array.isArray(req.body.data.query)) {
                query = queryHelpers.parseQueryArray(req.body.data.query, tokenFilter);
                let result = [];
                for (let i = 0; i < query.length; i++) {
                    result.push(await Identifier.findAll(query[i]));
                }
                res.json({status: 'ok', result: result});
            } else {
                query = queryHelpers.parseQuery(req.body.data.query, tokenFilter);
                const result = await Identifier.findAll(query);
                res.json({status: 'ok', result: result});
            }
        });
    }
);

module.exports = router;

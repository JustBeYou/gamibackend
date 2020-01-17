const express = require('express');
const permissions = require('../permissions.js');
const {Identifier} = require('../models/identifier.js');
const queryHelpers = require('../models/queryHelpers.js');
const errorHandlers = require('../errorHandlers.js');

const router = express.Router();

router.post(
    '/',
    [
        permissions.necessary(['IDENTIFIERS']),
        errorHandlers.requestEmptyQuery,
    ],
    (req, res) => {
        const allowCustomToken = permissions.check(req, 'ADMIN_IDENTIFIERS');
        const currentToken = permissions.getReqToken(req);

        errorHandlers.safeResponse(res, async () => {
            let result = null;
            if (Array.isArray(req.body.data.query)) {
                result = [];
                const queries = queryHelpers.parseQueryArray(req.body.data.query, currentToken, allowCustomToken);
                for (const index in queries) {
                    result.push(await Identifier.findAll(queries[index]));
                }
            }
            else {
                const query = queryHelpers.parseQuery(req.body.data.query, currentToken, allowCustomToken);
                result = await Identifier.findAll(query);
            }

            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;

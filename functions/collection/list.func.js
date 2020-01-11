const express = require('express');
const permissions = require('../permissions.js');
const {Collection} = require('../models/collection.js');
const queryHelpers = require('../models/queryHelpers.js');
const errorHandlers = require('../errorHandlers.js');

const router = express.Router();

router.post(
    '/',
    [
        permissions.necessary([]),
        errorHandlers.requestEmptyQuery,
    ],
    async (req, res) => {
        const allowCustomToken = permissions.check(req, 'ADMIN_ITEMS');

        let tokenFilter = permissions.getReqToken(req);
        if (allowCustomToken && req.body.data.token !== undefined) {
            tokenFilter = req.body.token;
        }

        errorHandlers.safeResponse(res, async () => {
            const query = queryHelpers.parseQuery(req.body.data.query, tokenFilter);

            const result = await Collection.findAll(query);
            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;

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
    (req, res) => {
        const allowCustomToken = permissions.check(req, 'ADMIN_ITEMS');
        const currentToken = permissions.getReqToken(req);

        errorHandlers.safeResponse(res, async () => {
            const query = queryHelpers.parseQuery(req.body.data.query, currentToken, allowCustomToken);

            const result = await Collection.findAll(query);
            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;

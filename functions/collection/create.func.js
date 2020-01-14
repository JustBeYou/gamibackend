const express = require('express');
const permissions = require('../permissions.js');
const {Collection} = require('../models/collection.js');
const errorHandlers = require('../errorHandlers.js');

const router = express.Router();

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyData,
    ],
    (req, res) => {
        if (req.body.data.modules !== undefined) {
            delete req.body.data.modules;
            // TODO: implement module creation
        }

        errorHandlers.safeResponse(res, async () => {
            req.body.data.parentToken = permissions.getReqToken(req);
            const result = await Collection.create(req.body.data);
            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;

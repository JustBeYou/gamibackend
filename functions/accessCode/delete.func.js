const accessCodes = require('../accessCodes.js');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const express = require('express');

const router = express.Router();

router.post(
    '/',
    [
        permissions.necessary([]),
    ],
    (req, res) => {

        errorHandlers.safeResponse(res, async () => {
            res.json({status: 'ok'});
        });
    },
);

module.exports = router;

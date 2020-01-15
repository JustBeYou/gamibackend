const express = require('express');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');

const router = express.Router();

router.post(
    '/',
    [
        permissions.necessary([]),
    ],
    (req, res) => {

        errorHandlers.safeResponse(res, () => {
            res.json({status: 'ok'});
        });
    },
);

module.exports = router;
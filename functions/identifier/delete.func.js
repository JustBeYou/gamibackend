const express = require('express');
const permissions = require('../permissions.js');

const router = express.Router();

router.post(
    '/',
    permissions.necessary(['IDENTIFIERS']),
    (req, res) => {
        res.json({status: 'ok'});
    },
);

module.exports = router;

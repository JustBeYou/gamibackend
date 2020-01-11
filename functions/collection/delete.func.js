const express = require('express');
const permissions = require('../permissions.js');
const {Collection} = require('../models/collection.js');

const router = express.Router();

router.post(
    '/',
    permissions.necessary([]),
    (req, res) => {
        res.json({status: 'ok'});
    },
);

module.exports = router;

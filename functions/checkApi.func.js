const express = require('express');
const permissions = require('./permissions.js');

const router = express.Router();
router.get('/', (req, res) => {
    res.json({status: 'ok'});
});

router.get(
    '/restricted',
    permissions.necessary(['FAKE_PERMISSION']),
    (req, res) => {
        res.json({status: 'ok'});
    },
);

router.get(
    '/allowed',
    permissions.necessary(['template_permission']),
    (req, res) => {
        res.json({status: 'ok'});
    },
);

module.exports = router;

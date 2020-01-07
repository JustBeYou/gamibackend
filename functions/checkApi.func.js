const express = require('express');
const permissions = require('./permissions.js');
const accessCodes = require('./accessCodes.js');
const {dbConnection} = require('./config.js');
const {Identifier} = require('./models/identifier.js');
const {Module} = require('./models/module.js');
const {Collection} = require('./models/collection.js');

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

router.get(
    '/check',
    (req, res) => {
        if (permissions.check(req, 'template_permission')) {
            res.json({status: 'ok'});
        }
        else {
            res.status(403).json({status: 'forbbiden'});
        }
    },
);

router.get(
    '/dbTest',
    (req, res) => {
        dbConnection.sync({alter: true});
        res.json({status: 'ok'});
    },
);

router.post(
    '/checkCode',
    async (req, res) => {
        const codeObj = await accessCodes.getAccessCode(req.body.code);
        if (codeObj === null) {
            res.json({status: 'not access code'});
            return ;
        }
        if (!accessCodes.isAssociated(codeObj, req.header('token'))) {
            res.json({status: 'not associated'});
            return ;
        }

        res.json({status: 'ok'});
    },
);

router.post(
    '/assocCode',
    async (req, res) => {
        const result = await accessCodes.associate(req.body.code, req.header('token'));
        if (result === false) {
            res.json({'status': 'error'});
            return ;
        }
        res.json({status: 'ok'});
    },
);


module.exports = router;

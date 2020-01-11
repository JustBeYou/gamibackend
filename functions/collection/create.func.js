const express = require('express');
const permissions = require('../permissions.js');
const {Collection} = require('../models/collection.js');

const router = express.Router();

router.post(
    '/',
    permissions.necessary(['ITEMS']),
    async (req, res) => {
        if (req.body.data === undefined) {
            res.status(400).json({status: 'empty body'});
            return ;
        }

        if (req.body.data.modules !== undefined) {
            delete req.body.data.modules;
            // TODO: implement module creation
        }

        try {
            req.body.data.parentToken = permissions.getReqToken(req);
            const result = await Collection.create(req.body.data);
            res.json({status: 'ok', result: result});
        }
        catch (error) {
            res.status(400).json({status: error.toString()});
        }
    }
);

module.exports = router;

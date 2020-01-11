const express = require('express');
const permissions = require('../permissions.js');
const {Identifier} = require('../models/identifier.js');

const router = express.Router();

async function readIdentifier(identifier) {
    const identifierRef = await Identifier.findOne({
        where: identifier
    });
    return Identifier.getCollection(identifierRef);
}

router.post(
    '/',
    permissions.necessary([]),
    async (req, res) => {
        if (req.body.data === undefined || req.body.data.query === undefined) {
            res.status(400).json({status: 'empty body'});
            return ;
        }

        let result = [];
        try {
            if (Array.isArray(req.body.data.query)) {
                for (const identifier of req.body.data.query) {
                    result.push(await readIdentifier(identifier));
                }
            } else {
                result = await readIdentifier(req.body.data.query);
            }

            res.json({status: 'ok', result: result});
        } catch (error) {
            res.status(400).json({status: error.toString()});
        }
    }
);

module.exports = router;

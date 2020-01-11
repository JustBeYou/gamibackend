const express = require('express');
const permissions = require('../permissions.js');
const {Identifier} = require('../models/identifier.js');
const errorHandlers = require('../errorHandlers.js');

const router = express.Router();

async function readIdentifier(identifier) {
    const identifierRef = await Identifier.findOne({
        where: identifier,
    });
    return Identifier.getCollection(identifierRef);
}

router.post(
    '/',
    [
        permissions.necessary([]),
        errorHandlers.requestEmptyQuery,
    ],
    async (req, res) => {
        errorHandlers.safeResponse(res, async () => {
            let result = [];
            if (Array.isArray(req.body.data.query)) {
                for (const identifier of req.body.data.query) {
                    result.push(await readIdentifier(identifier));
                }
            }
            else {
                result = await readIdentifier(req.body.data.query);
            }

            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;

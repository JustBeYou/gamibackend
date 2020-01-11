const express = require('express');
const permissions = require('../permissions.js');
const {Identifier} = require('../models/identifier.js');

const router = express.Router();

function parseQuery(query, token) {
    let finalQuery = query;
    if (query.alterationType !== undefined) {
        delete finalQuery.alterationType;
        delete finalQuery.startTime;
        delete finalQuery.endTime;

        finalQuery = {
            ...finalQuery,
            ...Identifier.timestampFilter(
                query.alterationType,
                query.startTime,
                query.endTime)
        };
    }

    finalQuery.parentToken = token;
    finalQuery = {
        where: finalQuery,
    };

    return finalQuery;
}

function parseQueryArray(queries, token) {
    let finalQueries = [];
    for (let i = 0; i < queries.length; i++) {
        finalQueries.push(
            parseQuery(queries[i], token)
        );
    }

    return finalQueries;
}

// TODO: implement pagination
router.post(
    '/',
    permissions.necessary(['IDENTIFIERS']),
    async (req, res) => {
        const allowCustomToken = permissions.check(req, 'ADMIN_IDENTIFIERS');

        let tokenFilter = permissions.getReqToken(req);
        if (allowCustomToken && req.body.data.token !== undefined) {
            tokenFilter = req.body.token;
        }

        try {
            let query = {};
            if (Array.isArray(req.body.data.query)) {
                query = parseQueryArray(req.body.data.query, tokenFilter);
                let result = [];
                for (let i = 0; i < query.length; i++) {
                    result.push(await Identifier.findAll(query[i]));
                }
                res.json({status: 'ok', result: result});
            } else {
                query = parseQuery(req.body.data.query, tokenFilter);
                const result = await Identifier.findAll(query);
                res.json({status: 'ok', result: result});
            }
        }
        catch (error) {
            res.status(400).json({status: error.toString()});
        }
    }
);

module.exports = router;

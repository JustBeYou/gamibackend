const express = require('express');
const permissions = require('../permissions.js');
const errorHandlers = require('../errorHandlers.js');
const moduleQueryHelpers = require('./queryHelpers.js');
const {Module, classOfModuleType} = require('../models/module.js');

const router = express.Router();

async function findAll(query) {
    /*
    TODO: module query should be optimized
    This would be the shortest (and most flexibile) way of implementing the query,
    but if a column does not exists in some associated table,
    an error would occur
    const finalQuery = {
        where: query.baseQuery.where,
        include: {
            all: true,
            where: query.concreteQuery.where,
        }
    };*/

    let finalQuery = {
        where: query.baseQuery.where,
    };
    if (query.baseQuery.where.type !== undefined) {
        finalQuery.include = {
            model: classOfModuleType[query.baseQuery.where.type],
            where: query.concreteQuery.where,
        };
    }    
    return await Module.findAll(finalQuery);
}

router.post(
    '/',
    [
        permissions.necessary([]),
        errorHandlers.requestEmptyQuery,
    ],
    (req, res) => {
        const allowCustomToken = permissions.check(req, 'ADMIN_ITEMS');
        const currentToken = permissions.getReqToken(req);

        errorHandlers.safeResponse(res, async () => {
            const query = moduleQueryHelpers.parseQuery(req.body.data.query, currentToken, allowCustomToken);

            const result = await findAll(query);
            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;
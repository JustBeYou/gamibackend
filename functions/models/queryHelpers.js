const {Op} = require('sequelize');

// TODO: items per page limit may be changed
const itemsPerPageLimit = 100;

// alterationType - createdAt, updatedAt
// TODO: implement filter for timestamp deletedAt
function timestampFilter(alterationType, startTime, endTime) {
    const filter = {};
    filter[alterationType] = {
        [Op.and]: {
            [Op.gte]: startTime,
            [Op.lte]: endTime,
        },
    };
    return filter;
}

function parseQuery(query, currentToken, allowCustomToken) {
    let finalQuery = {...query};

    if (query.alterationType !== undefined) {
        delete finalQuery.alterationType;
        delete finalQuery.startTime;
        delete finalQuery.endTime;

        finalQuery = {
            ...finalQuery,
            ...timestampFilter(
                query.alterationType,
                query.startTime,
                query.endTime),
        };
    }

    if (query.parentToken === undefined && !allowCustomToken) {
        query.parentToken = currentToken;
    }
    else if (query.parentToken !== currentToken && !allowCustomToken) {
        throw new Error('not enough permissions');
    }

    let limit = itemsPerPageLimit;
    let offset = 0;
    if (query.page !== undefined && query.itemsPerPage !== undefined) {
        if (query.itemsPerPage > itemsPerPageLimit) {
            throw new Error('items per page limit exceeded');
        }

        limit = query.itemsPerPage;
        offset = query.page * query.itemsPerPage;
        delete finalQuery.itemsPerPage;
        delete finalQuery.page;
    }

    finalQuery = {
        limit,
        offset,
        where: finalQuery,
    };

    return finalQuery;
}

function parseQueryArray(queries, currentToken, allowCustomToken) {
    let finalQueries = [];
    for (const query of queries) {
        finalQueries.push(
            parseQuery(query, currentToken, allowCustomToken),
        );
    }

    return finalQueries;
}

module.exports = {
    parseQuery,
    parseQueryArray,
    timestampFilter,
};

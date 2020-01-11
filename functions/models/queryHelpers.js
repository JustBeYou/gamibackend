const {Op} = require('sequelize');

// alterationType - createdAt, updatedAt
// TODO: implement filter for timestamp deletedAt
function timestampFilter(alterationType, startTime, endTime) {
    const filter = {};
    console.log(alterationType);
    filter[alterationType] = {
        [Op.and]: {
            [Op.gte]: startTime,
            [Op.lte]: endTime,
        },
    };
    return filter;
}

function parseQuery(query, token) {
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
            parseQuery(queries[i], token),
        );
    }

    return finalQueries;
}

module.exports = {
    parseQuery,
    parseQueryArray,
    timestampFilter,
};

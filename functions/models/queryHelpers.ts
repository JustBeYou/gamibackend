import {Op} from 'sequelize';

// TODO: port this to TS later

const itemsPerPageLimit = 100;

// alterationType - createdAt, updatedAt
// TODO: implement filter for timestamp deletedAt
export function timestampFilter(alterationType: string, startTime: Date, endTime: Date) {
    const filter = {} as DynamicObject;
    filter[alterationType] = {
        [Op.and]: {
            [Op.gte]: startTime,
            [Op.lte]: endTime,
        },
    };
    return filter;
}

// TODO: make this shorter
export function parseQuery(query: DynamicObject, currentToken: string, allowCustomToken: boolean) {
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
        finalQuery.parentToken = currentToken;
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

export function parseQueryArray(queries: Array<DynamicObject>, currentToken: string, allowCustomToken: boolean) {
    const finalQueries = [];
    for (const query of queries) {
        finalQueries.push(
            parseQuery(query, currentToken, allowCustomToken),
        );
    }

    return finalQueries;
}

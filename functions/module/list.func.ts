import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import * as errorHandlers from '../errorHandlers';
import * as moduleQueryHelpers from './queryHelpers';
import {Module, classOfModuleType} from '../models/module';
import { getValidContext } from '../permissions';

const router = Router();
export default router;

// TODO: ModuleList is the only endpoint that modifies the output of parseQuery(), this should be fixed
// in order to be consitent
function findAll(query: any) {
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

    const finalQuery = {
        limit: query.limit,
        offset: query.offset,
        where: query.baseQuery.where,
    } as any;
    if (query.baseQuery.where.type !== undefined) {
        finalQuery.include = {
            model: classOfModuleType[query.baseQuery.where.type],
            where: query.concreteQuery.where,
        };
    }

    return Module.findAll(finalQuery);
}

router.post(
    '/',
    [
        permissions.necessary([]),
        errorHandlers.requestEmptyQuery,
    ],
    async (req: Request, res: Response) => {
        const context = getValidContext(req);
        const allowCustomToken = context.check('ADMIN_ITEMS');

        await errorHandlers.safeResponse(res, async () => {
            const query = moduleQueryHelpers.parseQuery(req.body.data.query, context.token, allowCustomToken);

            const result = await findAll(query);
            res.json({status: 'ok', result});
        });
    },
);


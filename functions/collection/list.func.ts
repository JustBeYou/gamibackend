import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import {Collection} from '../models/collection';
import * as queryHelpers from '../models/queryHelpers';
import * as errorHandlers from '../errorHandlers';
import { getValidContext } from '../permissions';

const router = Router();
export default router;

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyQuery,
    ],
    async (req: Request, res: Response) => {
        const context = getValidContext(req);
        const allowCustomToken = context.check('ADMIN_ITEMS');

        await errorHandlers.safeResponse(res, async () => {
            const query = queryHelpers.parseQuery(req.body.data.query, context.token, allowCustomToken);

            const result = await Collection.findAll(query);
            res.json({status: 'ok', result});
        });
    },
);


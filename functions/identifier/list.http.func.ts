import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import {Identifier} from '../models/identifier';
import * as queryHelpers from '../models/queryHelpers';
import * as errorHandlers from '../errorHandlers';

const router = Router();
export default router;

router.post(
    '/',
    [
        permissions.necessary(['IDENTIFIERS']),
        errorHandlers.requestEmptyQuery,
    ],
    async (req: Request, res: Response) => {
        const context = permissions.getValidContext(req);
        const allowCustomToken = context.check('ADMIN_IDENTIFIERS');

        await errorHandlers.safeResponse(res, async () => {
            const result = [];
            const queries = queryHelpers.parseQueryArray(req.body.data.query, context.token, allowCustomToken);
            for (const index in queries) {
                result.push(await Identifier.findAll(queries[index]));
            }

            res.json({status: 'ok', result});
        });
    },
);



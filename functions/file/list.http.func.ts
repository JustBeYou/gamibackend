import * as permissions from '../permissions';
import {Request, Response, Router} from 'express';
import * as errorHandlers from '../errorHandlers';
import * as queryHelpers from '../models/queryHelpers';
import { FileInfo } from '../models/fileInfo';

const router = Router();
export default router;

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyQuery,   
    ],
    async (req: Request, res: Response) => {
        const context = permissions.getValidContext(req);
        const allowCustomToken = context.check('ADMIN_ITEMS');

        await errorHandlers.safeResponse(res, async() => {
            const queries = queryHelpers.parseQueryArray(
                req.body.data.query,
                context.token,
                allowCustomToken,
            );
            
            const result = [];
            for (const index in queries) {
                result.push(await FileInfo.findAll(queries[index]));
            }

            res.json({status: 'ok', result});
        });
    },
);
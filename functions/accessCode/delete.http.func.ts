import * as accessCodes from '../accessCodes';
import * as permissions from '../permissions';
import * as errorHandlers from '../errorHandlers';
import {Request, Response, Router} from 'express';
import {Collection} from '../models/collection';
import * as collectionErrorHandlers from '../collection/errorHandlers';
import { getValidContext } from '../permissions';
import { AccessCodeSchema } from '../accessCodes';

const router = Router();
export default router;

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyData,
    ],
    async (req: Request, res: Response) => {
        const context = getValidContext(req);
        const isAdmin = context.check('ADMIN_ITEMS');

        await errorHandlers.safeResponse(res, async () => {
            const codeObj = await accessCodes.getAccessCode(req.body.data.code as string);
            const collectionRef = await Collection.findOne({
                where: {
                    id: codeObj.parentCollection,
                },
            });
            collectionErrorHandlers.validateReference(collectionRef, context.token, isAdmin);
            await accessCodes.modifyAccessCode(req.body.data.code as string, {type: 'INACTIVE'} as AccessCodeSchema);

            res.json({status: 'ok'});
        });
    },
);



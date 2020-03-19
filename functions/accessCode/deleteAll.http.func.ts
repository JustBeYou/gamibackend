import * as accessCodes from '../accessCodes';
import * as permissions from '../permissions';
import * as errorHandlers from '../errorHandlers';
import {Request, Response, Router} from 'express';
import * as collectionErrorHandlers from '../collection/errorHandlers';
import { getValidContext } from '../permissions';

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
            const collectionId = req.body.data.CollectionId as number;
            await collectionErrorHandlers.validateReferenceById(collectionId, context.token, isAdmin);
            await accessCodes.deleteAllAccessCodes(collectionId);
            res.json({status: 'ok'});
        });
    },
);



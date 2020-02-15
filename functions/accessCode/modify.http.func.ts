import * as accessCodes from '../accessCodes';
import * as permissions from '../permissions';
import * as errorHandlers from '../errorHandlers';
import {Request, Response, Router} from 'express';
import {Collection} from '../models/collection';
import * as collectionErrorHandlers from '../collection/errorHandlers';
import { AccessCodeSchema, AccessCodeUpdateSchema } from '../accessCodes';
import { getValidContext } from '../permissions';

const router = Router();
export default router;

async function updateAccessCode(code: string, properties: AccessCodeSchema, currentToken: string, isAdmin: boolean) {
    const codeObj = await accessCodes.getAccessCode(code);
    const collectionRef = await Collection.findOne({
        where: {
            id: codeObj.parentCollection,
        },
    });
    collectionErrorHandlers.validateReference(collectionRef, currentToken, isAdmin);
    await accessCodes.modifyAccessCode(code, properties);
}

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
            for (const entry of req.body.data as Array<AccessCodeUpdateSchema>) {
                await updateAccessCode(
                    entry.code,
                    entry.update,
                    context.token,
                    isAdmin,
                );
            }
            

            res.json({status: 'ok'});
        });
    },
);



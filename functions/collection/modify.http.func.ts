import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import { Collection, CollectionUpdateSchema } from '../models/collection';
import * as errorHandlers from '../errorHandlers';
import { validateReference, validateImmutable } from './errorHandlers';
import { getValidContext } from '../permissions';

const router = Router();
export default router;

async function updateCollection(
    toUpdateProps: CollectionUpdateSchema,
    token: string, 
    isAdmin: boolean) {
    
    const collectionRef = await Collection.findOne({
        where: {
            id: toUpdateProps.id,
        },
    });

    const validCollectionRef = validateReference(collectionRef, token, isAdmin);
    validateImmutable(toUpdateProps.update);

    toUpdateProps.update.updatedByToken = token;
    return validCollectionRef.update(toUpdateProps.update);
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
            const result = await updateCollection(
                req.body.data as CollectionUpdateSchema,
                context.token,
                isAdmin,
            );

            res.json({status: 'ok', result});
        });
    },
);
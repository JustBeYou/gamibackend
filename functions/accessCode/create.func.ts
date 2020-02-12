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

async function parse(properties: AccessCodeSchema, token: string, isAdmin: boolean) {
    const collectionId = properties.parentCollection;
    const collectionRef = await Collection.findOne({
        where: {
            id: collectionId,
        },
    });

    const validCollectionRef = collectionErrorHandlers.validateReference(collectionRef, token, isAdmin);

    // if there are no properties specified, use the default configuration
    let newProperties = properties;
    if (properties.type === undefined || properties.type === null) {
        newProperties = JSON.parse(validCollectionRef.accessConfiguration);
    }
    newProperties.parentCollection = collectionId;
    return accessCodes.createAccessCode(newProperties);
}

async function parseArray(properties: Array<AccessCodeSchema>, token: string, isAdmin: boolean) {
    const result: Array<string> = [];
    for (const property of properties) {
        result.push(await parse(property, token, isAdmin));
    }

    return result;
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
            const result = await parseArray(req.body.data as Array<AccessCodeSchema>, context.token, isAdmin);

            res.json({status: 'ok', result});
        });
    },
);



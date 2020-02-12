import * as accessCodes from '../accessCodes';
import * as permissions from '../permissions';
import * as errorHandlers from '../errorHandlers';
import {Request, Response, Router} from 'express';
import {Collection} from '../models/collection';
import * as collectionErrorHandlers from '../collection/errorHandlers';
import {getMainDatabase} from '../database';
import { getValidContext } from '../permissions';
import { Transaction } from 'sequelize/types';
import { AccessCodeSchema } from '../accessCodes';

const router = Router();
export default router;

type AccessCodeGenerateSchema = {
    count: number,
} & AccessCodeSchema;

// TODO: make this shorter!
function parse(properties: AccessCodeGenerateSchema, token: string, isAdmin: boolean) {
    return getMainDatabase().executeTransaction(async (transaction: Transaction) => {
        const codesCount = properties.count;
        const parentCollection = properties.parentCollection;

        let newProperties = properties;
        delete newProperties.count;

        const collectionRef = await Collection.findOne({
            where: {
                id: parentCollection,
            },
            transaction,
        });

        const validCollectionRef = collectionErrorHandlers.validateReference(collectionRef, token, isAdmin);

        // if there are no properties specified, use the default configuration
        if (properties.type === undefined || properties.type === null) {
            newProperties = JSON.parse(validCollectionRef.accessConfiguration);
        }
        else {
            // or change the default one
            await validCollectionRef.update({
                accessConfiguration: JSON.stringify(newProperties),
            }, {
                transaction,
            });
        }
        newProperties.parentCollection = validCollectionRef.id;

        await accessCodes.deleteAllAccessCodes(validCollectionRef.id);
        const result: Array<string> = [];
        for (let i = 0; i < codesCount; i++) {
            result.push(await accessCodes.createAccessCode(newProperties));
        }

        return result;
    });
}

async function parseArray(properties: Array<AccessCodeGenerateSchema>, token: string, isAdmin: boolean) {
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
            const result = await parseArray(req.body.data as Array<AccessCodeGenerateSchema>, context.token, isAdmin);

            res.json({status: 'ok', result});
        });
    },
);



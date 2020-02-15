import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import {Identifier, CollectionId} from '../models/identifier';
import * as errorHandlers from '../errorHandlers';
import { WhereAttributeHash } from 'sequelize/types';

const router = Router();
export default router;

async function readIdentifier(identifier: WhereAttributeHash) {
    const identifierRef = await Identifier.findOne({
        where: identifier,
    });
    return Identifier.getCollection(identifierRef);
}

router.post(
    '/',
    [
        permissions.necessary([]),
        errorHandlers.requestEmptyQuery,
    ],
    async (req: Request, res: Response) => {
        await errorHandlers.safeResponse(res, async () => {
            const result: Array<CollectionId | null> = [];
            for (const identifierFilter of req.body.data.query) {
                result.push(await readIdentifier(identifierFilter as WhereAttributeHash));
            }

            res.json({status: 'ok', result});
        });
    },
);



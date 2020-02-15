import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import  {Identifier, IdentifierSchema, IdentifierUpdateSchema} from '../models/identifier';
import * as errorHandlers from '../errorHandlers';
import * as identifierErrorHandlers from './errorHandlers';

const router = Router();
export default router;

async function updateIdentifier(id: number, properties: IdentifierSchema, token: string, isAdmin: boolean) {
    const identifierRef = await Identifier.findOne({
        where: {
            id,
        },
    });

    const identifierValidRef = identifierErrorHandlers.validateReference(identifierRef, token, isAdmin);
    identifierErrorHandlers.validateImmutable(properties);

    properties.updatedByToken = token;

    return identifierValidRef.update(properties);
}

async function updateIdentifierArray(array: Array<IdentifierUpdateSchema>, token: string, isAdmin: boolean) {
    const result = [];
    for (const toUpdate of array) {
        result.push(await updateIdentifier(
            toUpdate.id,
            toUpdate.update,
            token,
            isAdmin,
        ));
    }
    return result;
}

router.post(
    '/',
    [
        permissions.necessary(['IDENTIFIERS']),
        errorHandlers.requestEmptyData,
    ],
    async (req: Request, res: Response) => {
        const context = permissions.getValidContext(req);
        const isAdmin = context.check('ADMIN_IDENTIFIERS');

        let result = null;
        await errorHandlers.safeResponse(res, async () => {
            result = await updateIdentifierArray(
                req.body.data as Array<IdentifierUpdateSchema>,
                context.token,
                isAdmin,
            );

            res.json({status: 'ok', result});
        });
    },
);



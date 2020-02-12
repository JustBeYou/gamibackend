import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import {Identifier, IdentifierSchema} from '../models/identifier';
import * as errorHandlers from '../errorHandlers';

const router = Router();
export default router;

router.post(
    '/',
    [
        permissions.necessary(['IDENTIFIERS']),
        errorHandlers.requestEmptyData,
    ],
    async (req: Request, res: Response) => {
        const context = permissions.getValidContext(req);
        const allowCustom = context.check('ADMIN_IDENTIFIERS') || context.check('CUSTOM_IDENTIFIERS');

        await errorHandlers.safeResponse(res, async () => {
            const created = await Identifier.validateAndCreate(
                // TODO: add runtime validation for dynamic objects
                req.body.data as IdentifierSchema,
                allowCustom,
                context.token,
            );
            res.json({status: 'ok', result: created});
        });
    },
);



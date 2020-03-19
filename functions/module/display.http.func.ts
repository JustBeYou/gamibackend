import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import * as errorHandlers from '../errorHandlers';
import { getValidContext } from '../permissions';
import { Module } from '../models/module';
import { Collection } from '../models/collection';
import { validateReferenceAndPermissions } from '../collection/errorHandlers';

const router = Router();
export default router;

router.post(
    '/',
    [
        permissions.necessary([]),
        errorHandlers.requestEmptyQuery,
    ],
    async (req: Request, res: Response) => {
        const context = getValidContext(req);
        const isAdmin = context.check('ADMIN_ITEMS');

        await errorHandlers.safeResponse(res, async () => {
            const module = await Module.findOne({
                where: {
                    id: req.body.data.query.id,
                },
                include: [
                    {
                        all: true
                    },
                ]
            });

            if (module === null) {
                throw new Error('Module not found');
            }

            const parentCollection = await Collection.findOne({
                where: {
                    id: module.CollectionId,
                }
            });
            await validateReferenceAndPermissions(parentCollection, context.accessCode, context.token, isAdmin);

            res.json({status: 'ok', result: module});
        });
    },
);


import * as permissions from '../permissions';
import {Request, Response, Router} from 'express';
import * as errorHandlers from '../errorHandlers';
import {Module} from '../models/module';
import * as moduleErrorHandlers from './errorHandlers';
import { getMainDatabase } from '../database';
import { Transaction } from 'sequelize/types';

const router = Router();
export default router;

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyData,   
    ],
    async (req: Request, res: Response) => {
        const context = permissions.getValidContext(req);
        const isAdmin = context.check('ADMIN_ITEMS');

        await errorHandlers.safeResponse(res, async() => {
            await getMainDatabase().executeTransaction(async (transaction: Transaction) => {
                const module = await Module.findOne({
                    where: {
                        id: req.body.data.ModuleId,
                    },
                    transaction,
                });
                const validModule = moduleErrorHandlers.validateReference(module, context.token, isAdmin);
                await validModule.update({CollectionId: null}, {transaction});
            });

            res.json({status: 'ok'});
        });
    },
);
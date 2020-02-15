import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import * as errorHandlers from '../errorHandlers';
import {getMainDatabase} from '../database';
import * as moduleErrorHandlers from './errorHandlers';
import {Module} from '../models/module';
import { getValidContext } from '../permissions';
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
        const context = getValidContext(req);
        const isAdmin = context.check('ADMIN_ITEMS');

        await errorHandlers.safeResponse(res, async () => {
            await getMainDatabase().executeTransaction(async (transaction: Transaction) => {
                const moduleRef = await Module.findOne({
                    where: {
                        id: req.body.data.id as number,
                    },
                    transaction,
                });

                const validModuleRef = moduleErrorHandlers.validateReference(moduleRef, context.token, isAdmin);

                await validModuleRef.update({
                    deletedByToken: context.token,
                    deletedAt: Date.now(),
                    inactive: true,
                }, {transaction});
            });

            res.json({status: 'ok'});
        });
    },
);


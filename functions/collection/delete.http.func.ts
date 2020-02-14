import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import {Collection} from '../models/collection';
import * as errorHandlers from '../errorHandlers';
import {getMainDatabase} from '../database';
import * as collectionErrorHandlers from './errorHandlers';
import { Transaction } from 'sequelize/types';
import { getValidContext } from '../permissions';

const router = Router();
export default router;

// TODO: decide what to do with inactive entities

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
                const collectionRef = await Collection.findOne({
                    where: {
                        id: req.body.data.id as number,
                    },
                    transaction,
                });

                const validCollectionRef = collectionErrorHandlers.validateReference(collectionRef, context.token, isAdmin);

                await validCollectionRef.update({
                    deletedByToken: context.token,
                    deletedAt: Date.now(),
                    inactive: true,
                }, {transaction});
            });

            res.json({status: 'ok'});
        });

    },
);


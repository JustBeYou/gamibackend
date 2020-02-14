import * as permissions from '../permissions';
import {Request, Response, Router} from 'express';
import * as errorHandlers from '../errorHandlers';
import { FileInfo } from '../models/fileInfo';
import { getMainDatabase } from '../database';
import { Transaction } from 'sequelize/types';
import { validateReference } from './errorHandlers';

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
                const file = await FileInfo.findOne({
                    where: {
                        filename: req.body.data.filename,
                    },
                    transaction: transaction,
                });

                const validFile = await validateReference(file, context.token, isAdmin);

                await validFile.update({
                    deletedAt: Date.now(),
                    deleted: true,
                }, {
                    transaction: transaction
                });
            });

            res.json({status: 'ok'});
        });
    },
);
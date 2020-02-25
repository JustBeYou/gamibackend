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
        permissions.necessary(['FILE_PROCESSING']),
        errorHandlers.requestEmptyData,        
    ],
    async (req: Request, res: Response) => {
        const context = permissions.getValidContext(req);

        await errorHandlers.safeResponse(res, async() => {
            await getMainDatabase().executeTransaction(async (transaction: Transaction) => {
                const file = await FileInfo.findOne({
                    where: {
                        id: req.body.data.id as number,
                    },
                    transaction: transaction,
                });

                const validFile = await validateReference(file, context.token, true);

                await validFile.update({
                    status: 'PROCESSED'
                }, {
                    transaction: transaction
                });
            });

            res.json({status: 'ok'});
        });
    },
);
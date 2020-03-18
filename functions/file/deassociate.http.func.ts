import * as permissions from '../permissions';
import {Request, Response, Router} from 'express';
import * as errorHandlers from '../errorHandlers';
import { FileInfo, FileInfoToModule } from '../models/fileInfo';
import * as fileInfoErrorHandlers from './errorHandlers';
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
                const fileInfo = await FileInfo.findOne({
                    where: {
                        filename: req.body.data.filename,
                    },
                    transaction,
                });
                const validFileInfo = fileInfoErrorHandlers.validateReference(fileInfo, context.token, isAdmin);
    
                const associationElement = await FileInfoToModule.findOne({
                    where: {
                        ModuleId: req.body.data.ModuleId,
                        FileInfoId: validFileInfo.id,
                    },
                    transaction,
                });
    
                if (associationElement === null) {
                    throw new Error('File and Module not associated');
                }
    
                await associationElement.destroy({transaction});
            });

            res.json({status: 'ok'});
        });
    },
);
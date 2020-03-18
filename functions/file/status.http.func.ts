import * as permissions from '../permissions';
import {Request, Response, Router} from 'express';
import * as errorHandlers from '../errorHandlers';
import { FileInfo } from '../models/fileInfo';
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
            const file = await FileInfo.findOne({
                where: {
                    filename: req.body.data.filename,
                }
            });
            
            const validFile = await validateReference(file, context.token, isAdmin);

            const result = {
                status: validFile.status,
            };

            res.json({status: 'ok', result});
        });
    },
);
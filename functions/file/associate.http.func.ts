import * as permissions from '../permissions';
import {Request, Response, Router} from 'express';
import * as errorHandlers from '../errorHandlers';
import { FileInfo } from '../models/fileInfo';
import { Module } from '../models/module';
import * as moduleErrorHandlers from '../module/errorHandlers';
import * as fileInfoErrorHandlers from './errorHandlers';

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
            const parentModule = await Module.findOne({
                where: {
                    id: req.body.data.ModuleId
                }
            });
            const validParentModule = moduleErrorHandlers.validateReference(parentModule, context.token, isAdmin);

            const fileInfo = await FileInfo.findOne({
                where: {
                    filename: req.body.data.filename
                }
            });
            const validFileInfo = fileInfoErrorHandlers.validateReference(fileInfo, context.token, isAdmin);

            await validParentModule.addFileInfo(validFileInfo);

            res.json({status: 'ok'});
        });
    },
);
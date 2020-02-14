import * as permissions from '../permissions';
import {Request, Response, Router} from 'express';
import * as errorHandlers from '../errorHandlers';
import { getDefaultStorage } from '../storage';

const router = Router();
export default router;

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyData,        
    ],
    async (req: Request, res: Response) => {
        const storage = getDefaultStorage();

        await errorHandlers.safeResponse(res, async() => {
            const url = await storage.getSignedURL(
                req.body.data.bucket as string,
                req.body.data.file as string,
                req.body.data.type as string,
                "resumable",
            );

            res.json({status: 'ok', result: url});
        });
    },
);
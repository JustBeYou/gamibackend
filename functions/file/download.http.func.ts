import * as permissions from '../permissions';
import {Request, Response, Router} from 'express';
import * as errorHandlers from '../errorHandlers';
import { getDefaultStorage, getDefaultBucket } from '../storage';

const router = Router();
export default router;

// TODO: permission checking on file download!!!
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
                getDefaultBucket(),
                req.body.data.filename as string,
                req.body.data.type as string,
                "read",
            );
            const result = {url};

            res.json({status: 'ok', result});
        });
    },
);
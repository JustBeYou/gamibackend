import * as permissions from '../permissions';
import {Request, Response, Router} from 'express';
import * as errorHandlers from '../errorHandlers';
import { getDefaultStorage, getDefaultBucket } from '../storage';
import {uuid} from 'uuidv4';
import { fileCreationCache, FileCreationMetadata } from './creationCache';
import { _refWithOptions } from 'firebase-functions/lib/providers/database';

const router = Router();
export default router;

const permissionsOfMimeTypes = {
    image: 'ITEM_IMAGES',
    video: 'ITEM_VIDEOS',
    text: 'ITEMS',
} as DynamicObject;

function getFilenameExtension(name: string) {
    const tokens = name.split('.');
    return tokens[tokens.length - 1];
}

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyData,        
    ],
    async (req: Request, res: Response) => {
        const context = permissions.getValidContext(req);
        const storage = getDefaultStorage();

        await errorHandlers.safeResponse(res, async() => {
            if (req.body.data.filename === undefined) throw new Error('Empty filename.');
            if (req.body.data.filename.indexOf('.') === -1) throw new Error('No file extension specified.');
            const mimeType = req.body.data.type as string;
            const extension = getFilenameExtension(req.body.data.filename);
        
            const haveMimeTypePermission = context.check(permissionsOfMimeTypes[mimeType]);
            if (haveMimeTypePermission === false) throw new Error('Not enough permissions.');

            const fileName = `${uuid()}.${extension}`;
            const url = await storage.getSignedURL(
                getDefaultBucket(),
                fileName,
                mimeType,
                "resumable",
            );
            
            await fileCreationCache.set(fileName, {
                parentToken: context.token,
                originalFilename: req.body.data.filename,
                extension: extension,
            } as FileCreationMetadata);

            const result = {
                url: url,
                file: fileName,
            }

            res.json({status: 'ok', result});
        });
    },
);
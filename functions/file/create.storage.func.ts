import { ObjectMetadata } from "firebase-functions/lib/providers/storage";
import {FileInfo} from '../models/fileInfo';
import { fileCreationCache } from "./creationCache";
import { defaultJobsPool, ProcessingJob, getDefaultWorker } from "./fileProcessingJobsPool";

const shouldProcess: Array<string | undefined> = ['video', 'image'];
const processingFunctions: DynamicObject = {
    'video': addVideoInQueue,
    'image': addImageInQueue,
};

function replaceExtension(name: string, newExtension: string) {
    const tokens = name.split('.');
    const tokensNoExtension = tokens.splice(0, tokens.length - 1);
    const newName = tokensNoExtension.join('.') + newExtension;
    return newName;
}

async function addVideoInQueue(parentFile: FileInfo) {
    const defaultVideoExtension = 'mp4';
    const resolutions = [480, 720, 1080];

    for (const resolution of resolutions) {
        const newName = replaceExtension(parentFile.filename, `_${resolution.toString()}.${defaultVideoExtension}`);

        const newFile = await parentFile.createFileInfo({
            isOriginal: false,
            bucket: parentFile.bucket,
            originalFilename: parentFile.originalFilename,
            filename: newName,
            sizeInBytes: parentFile.sizeInBytes,
            status: 'IN_QUEUE',
            parentToken: parentFile.parentToken,
            isSignedURLValid: false,
            deleted: false,

            resolutionInPixels: resolution,
            orientation: 'IGNORED',
        });

        defaultJobsPool.add({
            filename: newName,
            originalFilename: parentFile.filename,
            id: newFile.id,
            type: 'video',
            targetResolution: resolution,
            targetOrientation: 'IGNORED',
        } as ProcessingJob);
    }
}

async function addImageInQueue(parentFile: FileInfo) {
    const resolutions = [720, 1080];
    const orientations = ['portrait', 'landscape'];
    const defaultImageExtension = 'jpeg';

    for (const resolution of resolutions) {
        for (const orientation of orientations) {
            const newName = replaceExtension(parentFile.filename, `_${resolution.toString()}_${orientation}.${defaultImageExtension}`);

            const newFile = await parentFile.createFileInfo({
                isOriginal: false,
                bucket: parentFile.bucket,
                originalFilename: parentFile.originalFilename,
                filename: newName,
                sizeInBytes: parentFile.sizeInBytes,
                status: 'IN_QUEUE',
                parentToken: parentFile.parentToken,
                isSignedURLValid: false,
                deleted: false,

                resolutionInPixels: resolution,
                orientation: orientation.toUpperCase(),
            });
    
            defaultJobsPool.add({
                filename: newName,
                originalFilename: parentFile.filename,
                id: newFile.id,
                type: 'image',
                targetResolution: resolution,
                targetOrientation: orientation,
            } as ProcessingJob);
        }
    }
}

export default async function(fileMetadata: ObjectMetadata) {
    const originalMetadata = await fileCreationCache.get(fileMetadata.name!);

    const parentFile = await FileInfo.create({
        isOriginal: true,
        bucket: fileMetadata.bucket,
        originalFilename: originalMetadata.originalFilename,
        filename: fileMetadata.name,
        extension: originalMetadata.extension,
        sizeInBytes: fileMetadata.size,
        status: 'ORIGINAL',
        parentToken: originalMetadata.parentToken,
        isSignedURLValid: false,
        deleted: false,
    });

    await fileCreationCache.unset(fileMetadata.name!);

    if (shouldProcess.includes(fileMetadata.contentType)) {
        await processingFunctions[fileMetadata.contentType!](parentFile);
        await getDefaultWorker().applyStrategy();
    }
}
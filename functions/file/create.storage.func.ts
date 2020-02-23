import { ObjectMetadata } from "firebase-functions/lib/providers/storage";
import {FileInfo} from '../models/fileInfo';
import { fileCreationCache } from "./creationCache";
import { defaultJobsPool, ProcessingJob, getDefaultWorker } from "./fileProcessingJobsPool";

const shouldProcess: Array<string | undefined> = ['video', 'image'];

export default async function(fileMetadata: ObjectMetadata) {
    const originalMetadata = await fileCreationCache.get(fileMetadata.name!);

    const preevaluatedStatus = shouldProcess.includes(fileMetadata.contentType) ? 'NOT_PROCESSED' : 'PROCESSED'; 
    const createdFile = await FileInfo.create({
        bucket: fileMetadata.bucket,
        originalFilename: originalMetadata.originalFilename,
        filename: fileMetadata.name,
        sizeInBytes: fileMetadata.size,
        status: preevaluatedStatus,
        parentToken: originalMetadata.parentToken,
        isSignedURLValid: false,
        deleted: false,
    });

    await fileCreationCache.unset(fileMetadata.name!);

    if (preevaluatedStatus === 'NOT_PROCESSED') {
        await defaultJobsPool.add({
            id: createdFile.id,
        } as ProcessingJob);
        
        await getDefaultWorker().applyStrategy();
    }
}
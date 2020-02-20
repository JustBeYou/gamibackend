import { FirestoreCache } from "../cache";

export type FileCreationMetadata = {
    parentToken: string,
    originalFilename: string,
};

export const fileCreationCache = new FirestoreCache<FileCreationMetadata>();
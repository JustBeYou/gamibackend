import * as GCloudStorage from '@google-cloud/storage';

export interface Storage {
    createBucket(bucketName: string): Promise<void>;
    getSignedURL(bucketName: string, fileName: string, fileType: string, action: string): Promise<string>;
    checkFileExists(bucketName: string, fileName: string): Promise<boolean>;
    checkBucketExists(bucketName: string): Promise<boolean>;
};

export class GoogleCloudStorageWrapper implements Storage {
    private static storageConnectionObj = new GCloudStorage.Storage({
        projectId: 'gamibackend',
        keyFilename: './serviceAccountKey.json',
    });
    private bucketNamePrefix = 'gamibackend_';

    private validateBucketName(bucketName: string) {
        const possiblePrefix = bucketName.substring(0, this.bucketNamePrefix.length);
        if (possiblePrefix !== this.bucketNamePrefix) {
            throw new Error('Bucket name must be prefixed by ' + this.bucketNamePrefix);
        }

        return bucketName;
    }

    public async createBucket(bucketName: string) {
        try {
            await GoogleCloudStorageWrapper.storageConnectionObj.createBucket(
                this.validateBucketName(bucketName)
            );
        } catch(error) {
            throw new Error('Bucket creation failed: ' + error.toString());
        }

        return Promise.resolve();
    }

    public async getSignedURL(bucketName: string, fileName: string, fileType: string, action: string) {
        try {
            const validBucketName = this.validateBucketName(bucketName);
            const bucket = GoogleCloudStorageWrapper.storageConnectionObj.bucket(validBucketName);
            const file = bucket.file(fileName);

            const currentTime = new Date();
            const expireTime = this.helper_addMinutes(currentTime, 15);

            const signedURL = await file.getSignedUrl({
                expires: expireTime.toString(),
                action: action,
                contentType: fileType,
            } as GCloudStorage.GetSignedUrlConfig);

            return signedURL[0];
        } catch (error) {
            throw new Error('Could not get a signed URL: ' + error.toString());
        }
    }

    public async checkFileExists(bucketName: string, fileName: string) {
        const validateBucketName = this.validateBucketName(bucketName);
        const bucket = GoogleCloudStorageWrapper.storageConnectionObj.bucket(validateBucketName);
        const file = bucket.file(fileName);
        const exists = (await file.exists())[0];

        return Promise.resolve(exists);
    }

    public async checkBucketExists(bucketName: string) {
        const validateBucketName = this.validateBucketName(bucketName);
        const bucket = GoogleCloudStorageWrapper.storageConnectionObj.bucket(validateBucketName);
        const exists = (await bucket.exists())[0];

        return Promise.resolve(exists);
    }

    private helper_addMinutes(date: Date, minutes: number) {
        return new Date(date.getTime() + minutes * 60000);
    }
}

let defaultStorage: Storage = new GoogleCloudStorageWrapper();

export function getDefaultStorage() {
    return defaultStorage;
}

export function setDefaultStorage(storage: Storage) {
    defaultStorage = storage;
}
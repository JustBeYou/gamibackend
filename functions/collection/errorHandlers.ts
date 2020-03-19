import { Collection, CollectionSchema } from '../models/collection';
import * as accessCodes from '../accessCodes';
import * as passwordHash from 'password-hash';

export async function validateReferenceAndPermissions(
    reference: Collection | null, 
    accessCode: string | undefined, 
    token: string, 
    isAdmin: boolean) {
    
    if (reference === null) {
        throw new Error('Collection not found');
    }

    if (reference.parentToken === token || isAdmin) {
        return reference;
    }

    if (reference.accessStatus === 'PUBLIC') {
        return reference;
    }

    if (accessCode === undefined) {
        throw new Error('Access code required');
    }

    if (reference.protectionType === 'ACCESS_CODE') {
        await accessCodes.verifyAccessCode(reference, accessCode, token);
    }
    else if (reference.protectionType === 'PASSWORD') {
        if (passwordHash.verify(accessCode, reference.password) === false) {
            throw new Error('invalid password');
        }
    }

    return reference;
}

export function validateReference(
    reference: Collection | null, 
    token: string, 
    isAdmin: boolean) {
    
    if (reference === null) {
        throw new Error('Collection not found');
    }

    if (reference.parentToken !== token && !isAdmin) {
        throw new Error('not enough permissions');
    }

    return reference;
}

export async function validateReferenceById(
    id: number, 
    token: string, 
    isAdmin: boolean) {
    
    const collectionRef = await Collection.findOne({
        where: {
            id,
        },
    });
    return validateReference(collectionRef, token, isAdmin);
}

export function validateImmutable(properties: CollectionSchema) {
    if (properties.id !== undefined) {
        throw new Error('id is immutable');
    }
}

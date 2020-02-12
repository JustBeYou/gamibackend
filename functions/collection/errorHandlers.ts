import { Collection, CollectionSchema } from '../models/collection';
//import * as passwordHash from 'password-hash';

export async function validatePermissions(
    reference: Collection, 
    accessCode: string, 
    token: string, 
    isAdmin: boolean) {
    
    if (reference.parentToken === token || isAdmin) {
        return ;
    }

    if (reference.accessStatus === 'PUBLIC') {
        return ;
    }

    if (reference.protectionType === 'ACCESS_CODE') {
        // TODO: add types and remove comments here
        //await accessCodes.verifyAccessCode(reference, accessCode, token);
    }
    else if (reference.protectionType === 'PASSWORD') {
        //if (passwordHash.validatePassword(accessCode, reference.password) === false) {
        //    throw new Error('invalid password');
        //}
    }
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

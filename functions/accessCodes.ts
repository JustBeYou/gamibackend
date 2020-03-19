import {firestore} from './database';
import * as  permissions from './permissions';
import { Collection } from './models/collection';

export type AccessCodeSchema = {
    id: string,
    parentCollection: number,
    type: string,
    assocTokens: DynamicObject,
    maxUsers: number,
};

export type AccessCodeUpdateSchema = {
    code: string,
    update: AccessCodeSchema,
}

// TODO: access codes functions are a little bit inconsistent
export async function createAccessCode(properties: AccessCodeSchema) {
    // TODO: improve runtime validation 
    // This function could be useful in other parts of the code too. Need to refactor this for sure.
    function isNullOrUndefined(obj: any) {
        return obj === null || obj === undefined;
    }

    if (isNullOrUndefined(properties.assocTokens)) properties.assocTokens = {};
    if (isNullOrUndefined(properties.maxUsers)) properties.maxUsers = 1;
    if (isNullOrUndefined(properties.type)) throw new Error('Type of access code was not specified.');
    if (isNullOrUndefined(properties.parentCollection)) throw new Error('Access code needs a parent collection.');
    
    const newCode = await firestore.collection('accessCodes').add(properties);
    return newCode.id;
}
 
export async function listAccessCodes(id: number) {
    const docs = await firestore.collection('accessCodes').where('parentCollection', '==', id).get();

    const result: Array<AccessCodeSchema> = [];
    docs.forEach(doc => {
        result.push({id: doc.id, ...doc.data()} as AccessCodeSchema);
    });
    return result;
}

export async function deleteAllAccessCodes(id: number) {
    const docs = await firestore.collection('accessCodes').where('parentCollection', '==', id).get();

    docs.forEach(async (doc) => {
        await doc.ref.delete();
    });
}

export async function getAccessCode(code: string): Promise<AccessCodeSchema> {
    const codeRef = await firestore.collection('accessCodes').doc(code).get();

    if (!codeRef.exists) {
        throw new Error('Access code not found');
    }

    return {id: code, ...codeRef.data()} as AccessCodeSchema;
}

export async function modifyAccessCode(code: string, properties: AccessCodeSchema) {
    await firestore.collection('accessCodes').doc(code).update(properties);
}

// access codes and tokens have the same proprieties
export async function validateAccessCode(code: string) {
    const codeObj = await getAccessCode(code);
    if (codeObj === null) return false;
    return permissions.permissionValidatorsCatalog[codeObj.type](new Map(Object.entries(codeObj)));
}

export function canAssociateAnotherToken(codeObj: AccessCodeSchema) {
    return Object.keys(codeObj.assocTokens).length < codeObj.maxUsers;
}

export function isAssociated(codeObj: AccessCodeSchema, token: string) {
    return token in codeObj.assocTokens;
}

export async function associate(code: string, token: string) {
    const codeDocRef = firestore.collection('accessCodes').doc(code);

    const result = await firestore.runTransaction(async transaction => {
        const codeRef = await transaction.get(codeDocRef);
        if (!codeRef.exists) return false;

        const codeObj = codeRef.data() as AccessCodeSchema;
        if (!canAssociateAnotherToken(codeObj) || isAssociated(codeObj, token)) {
            return false;
        }

        transaction.update(codeDocRef, {
            [`assocTokens.${token}`]: null,
        });
        return true;
    });

    return result;
}

export function canAcccessCollection(codeObj: AccessCodeSchema, collection: Collection) {
    return collection.id === codeObj.parentCollection;
}

export async function verifyAccessCode(reference: Collection, accessCode: string, token: string) {
    const codeObj = await getAccessCode(accessCode);
    
    if (codeObj === null) {
        throw new Error('access code not found');
    }

    if (canAcccessCollection(codeObj, reference) === false) {
        throw new Error('access code is not related to the collection');
    }

    const associated = await associate(accessCode, token);
    if (associated === false) {
        throw new Error('associated tokens max limit exceeded');
    }

    const isValid = permissions.permissionValidatorsCatalog[codeObj.type](new Map(Object.entries(codeObj)));
    if (isValid === false) {
        throw new Error('access code is expirated');
    }
}

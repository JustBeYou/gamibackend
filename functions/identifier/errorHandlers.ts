import {Identifier, IdentifierSchema} from '../models/identifier';

export function validateReference(reference: Identifier | null, token: string, isAdmin: boolean) {
    if (reference === null) {
        throw new Error('Identifier not found');
    }

    if (reference.parentToken !== token && !isAdmin) {
        throw new Error('not enough permissions');
    }

    return reference;
}

export async function validateReferenceById(id: number, token: string, isAdmin: boolean) {
    const identifierRef = await Identifier.findOne({
        where: {
            id,
        },
    });
    validateReference(identifierRef, token, isAdmin);
}

export function validateImmutable(properties: IdentifierSchema) {
    if (properties.id !== undefined || properties.key !== undefined) {
        throw new Error('id and key are immutable');
    }
}
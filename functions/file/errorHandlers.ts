import { FileInfo } from "../models/fileInfo";

export async function validateReference(reference: FileInfo | null, token: string, isAdmin: boolean) {
    if (reference === null) throw new Error('File not found.');
    if (reference.parentToken !== token && !isAdmin) throw new Error('Not enough permissions.');

    return reference;
} 
import { Module, ModuleSchema, ConcreteModuleSchema } from '../models/module';

const permissionsOfModuleType = {
    IMAGE: 'ITEM_IMAGES',
    VIDEO: 'ITEM_VIDEOS',
    LIST: 'ITEMS',
    TEXT: 'ITEMS',
    CONTACT: 'ITEMS',
} as DynamicObject;

export function isAllowedToCreateModule(context: AuthContext, moduleType: string) {
    const hasPermission = context.check(permissionsOfModuleType[moduleType]);
    if (!hasPermission) {
        throw new Error('not enough permissions to create the module');
    }
}

export function validateReference(reference: Module | null, token: string, isAdmin: boolean) {
    if (reference === null) {
        throw new Error('Module not found');
    }

    if (reference.parentToken !== token && !isAdmin) {
        throw new Error('not enough permissions');
    }

    return reference;
}

export function validateImmutable(properties: ModuleSchema & ConcreteModuleSchema) {
    if (properties.id !== undefined || properties.type !== undefined || properties.CollectionId !== undefined) {
        throw new Error('id and type are immutable');
    }
}

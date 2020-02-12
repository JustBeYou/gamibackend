import {firestore} from './database';
import {Request, Response} from 'express';

export class Context implements AuthContext {
    constructor(public token: string | undefined, public tokenPermissions: PermissionsCollection | undefined) {}

    check(permission: string): boolean {
        if (this.tokenPermissions === undefined) return false;
        return validatePermission(this.tokenPermissions, permission);
    }
}

export class ValidatedContext extends Context {
    constructor(public token: string, public tokenPermissions: PermissionsCollection) {
        super(token, tokenPermissions);
    }
}

type PermissionProperties = Map<string, any>;
type PermissionsCollection = Map<string, any>;
type PermissionValidator = (permission: PermissionProperties) => boolean;
type PermissionsCatalog = {
    [name: string]: PermissionValidator,
};

export const permissionValidatorsCatalog: PermissionsCatalog = {
    PERMANENT: () => {
        return true;
    },

    // TODO: currCalls is never incremented, should fix
    LIMITED_CALLS: permissionProps => {
        return permissionProps.get('currCalls') < permissionProps.get('maxCalls');
    },

    LIMITED_TIME: permissionProps => {
        return Date.now() < permissionProps.get('expDate');
    },

    INACTIVE: () => {
        return false;
    },
};

export function getReqToken(req: Request): string | undefined {
    return req.header(tokenHeader);
}

export async function getTokenPermissions(token: string | undefined): Promise<undefined | PermissionsCollection> {
    if (token === undefined) return undefined;
    
    const tokenRef = await firestore.collection('tokens').doc(token).get();
    const tokenProps = tokenRef.data();

    if (tokenRef.exists && tokenProps !== undefined) {
        return new Map(Object.entries(tokenProps['permissions']));
    }

    return undefined;
}

const tokenHeader = 'token';
export async function middleware(req: Request, res: Response, next: Function) {
    // ESLINT gies a warning about race conditions here, but there is no risk of that
    const token = req.header(tokenHeader);
    req.context = new Context(
        token, 
        await getTokenPermissions(token)
    );

    next();
}

export function validatePermission(permissions: PermissionsCollection, key: string): boolean {
    if (!permissions.has(key)) return false;
    const permission = new Map(Object.entries(permissions.get(key)));
        
    const type = permission.get('type');
    if (type === undefined) return false;
    else return permissionValidatorsCatalog[type](permission);
}

// request middleware factory
export function necessary(permissionsList: Array<string>) {
    return (req: Request, res: Response, next: Function) => {
        const tokenPermissions = req.context.tokenPermissions;
        if (tokenPermissions === undefined) {
            res.status(403).json({message: 'Not authenticated.'});
            return ;
        }

        const isValid: boolean = permissionsList.reduce((maybeValid: boolean, permission: string): boolean => {
            return maybeValid && validatePermission(tokenPermissions, permission); 
        }, true);

        if (isValid) next();
        else res.status(403).json({message: 'Insufficient permissions.'});
    };
}

export function getContext(req: Request): Context {
    return req.context;
}

export function getValidContext(req: Request): ValidatedContext {
    const context = getContext(req);
    if (context.token === undefined || context.tokenPermissions === undefined) throw new Error('Not authenticated.');
    return new ValidatedContext(context.token, context.tokenPermissions);
}
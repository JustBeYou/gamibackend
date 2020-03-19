import {firestore, firebaseAdmin} from './database';
import {Request, Response} from 'express';

export class Context implements AuthContext {
    constructor(public token: string | undefined, 
                public tokenPermissions: PermissionsCollection | undefined,
                public accessCode: string | undefined) {}

    check(permission: string): boolean {
        if (this.tokenPermissions === undefined) return false;
        return validatePermission(this.tokenPermissions, permission, this);
    }
}

export class ValidatedContext extends Context {
    static fromAuthContext(context: AuthContext) {
        if (context.token === undefined || context.tokenPermissions === undefined) throw new Error('Not authenticated.');
        return new ValidatedContext(context.token, context.tokenPermissions, context.accessCode);
    }

    constructor(public token: string, public tokenPermissions: PermissionsCollection, public accessCode: string | undefined) {
        super(token, tokenPermissions, accessCode);
    }

    async incrementUsageCounter(permission: string): Promise<void> {
        const tokenRef = await firestore.collection('tokens').doc(this.token);
        const incrementByOne = firebaseAdmin.firestore.FieldValue.increment(1);
        const updateObject = {} as DynamicObject;
        updateObject[`permissions.${permission}.currCalls`] = incrementByOne;

        await tokenRef.update(updateObject);

        return Promise.resolve();
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

    LIMITED_CALLS: (permissionProps) => {
        const valid = permissionProps.get('currCalls') < permissionProps.get('maxCalls');
        if (valid) {
            const context: AuthContext = permissionProps.get('context');
            const validContext: ValidatedContext = ValidatedContext.fromAuthContext(context);
            const name: string = permissionProps.get('name');
    
            validContext.incrementUsageCounter(name);
        }

        return valid;
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
const accessCodeHeader = 'code';
export async function middleware(req: Request, res: Response, next: Function) {
    const token = req.header(tokenHeader);
    const code = req.header(accessCodeHeader);
    req.context = new Context(
        token, 
        await getTokenPermissions(token),
        code,
    );

    next();
}

export function validatePermission(permissions: PermissionsCollection, key: string, context: AuthContext): boolean {
    if (!permissions.has(key)) return false;
    const permission: PermissionProperties = new Map(Object.entries(permissions.get(key)));
    // TODO: this isn't the best practice, but it works for now. maybe refactor later
    permission.set('context', context);
    permission.set('name', key);
        
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
            return maybeValid && validatePermission(tokenPermissions, permission, req.context); 
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
    return new ValidatedContext(context.token, context.tokenPermissions, context.accessCode);
}
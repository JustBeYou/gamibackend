declare interface AuthContext {
    token: string | undefined,
    tokenPermissions: Map<string, any> | undefined,
    check: (permission: string) => boolean,
}

declare namespace Express {
    export interface Request {
        context: AuthContext,
    }
}
import { Response, Request } from 'express';

export async function safeResponse(response: Response, action: Function) {
    try {
        await action();
    }
    catch (error) {
        response.status(400).json({status: error.toString()});
    }
}

export function requestEmptyData(req: Request, res: Response, next: Function) {
    if (req.body.data === undefined) {
        res.status(400).json({status: 'empty body'});
        return ;
    }
    next();
}

export function requestEmptyQuery(req: Request, res: Response, next: Function) {
    if (req.body.data === undefined || req.body.data.query === undefined) {
        res.status(400).json({status: 'empty query'});
        return ;
    }
    next();
}


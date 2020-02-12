import * as functions from 'firebase-functions';
import {appRouters} from './app_loader';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as permissions from './permissions';
import {Request, Response, Express} from 'express';
import * as express from 'express';
import {initializeIdentifierTables} from './models/identifier';
import {initializeCollectionTables} from './models/collection';
import {initializeModuleTables} from './models/module';
import {getMainDatabase} from './database';

const loggerOutput = console;
function logger(req: Request, res: Response, next: Function) {
    loggerOutput.log(req.method, req.originalUrl);
    next();
}

const mainDatabase = getMainDatabase();
initializeIdentifierTables(mainDatabase);
initializeModuleTables(mainDatabase);
initializeCollectionTables(mainDatabase);

// TODO: remove this line. DEBUG ONLY
mainDatabase.getConnectionObject().sync({alter: true});

function addMiddlewares(app: Express) {
    app.use(logger);
    app.use(cors());
    app.use(bodyParser.json());
    app.use(permissions.middleware);   
}

for (const functionName in appRouters) {
    const app = express();
    addMiddlewares(app as Express);
    app.use(appRouters[functionName]);
    exports[functionName] = functions.https.onRequest(app);
}
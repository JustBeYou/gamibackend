import * as functions from 'firebase-functions';
import {loadedFunctions} from './app_loader';
import * as cors from 'cors';
import * as permissions from './permissions';
import {Request, Response, Express} from 'express';
import * as express from 'express';
import {getMainDatabase} from './database';
import {initializeIdentifierTables} from './models/identifier';
import {initializeCollectionTables} from './models/collection';
import {initializeModuleTables} from './models/module';
import {initializeFileInfoTables} from './models/fileInfo';
import { getDefaultBucket } from './storage';
import { getDefaultWorker } from './file/fileProcessingJobsPool';

const loggerOutput = console;
function logger(req: Request, res: Response, next: Function) {
    loggerOutput.log(req.method, req.originalUrl);
    next();
}

function initializeDatabase() {
    const mainDatabase = getMainDatabase();

    initializeIdentifierTables(mainDatabase);
    initializeFileInfoTables(mainDatabase);
    initializeModuleTables(mainDatabase);
    initializeCollectionTables(mainDatabase);
}

function addMiddlewares(app: Express) {
    app.use(logger);
    app.use(cors());
    app.use(express.json());
    app.use(permissions.middleware);   
}

function loadFunctions() { 
    for (const functionName in loadedFunctions['http']) {
        const app = express();
        addMiddlewares(app as Express);
        app.use(loadedFunctions['http'][functionName]);
        exports[functionName] = functions.https.onRequest(app);
    }

    for (const functionName in loadedFunctions['storage']) {
        exports[functionName] = functions.storage.bucket(getDefaultBucket()).object().onFinalize(loadedFunctions['storage'][functionName]);
    }

    // TODO: remove this, debug only
    const debugApp = express();
    addMiddlewares(debugApp);
    const router = express.Router();
    router.get('/createDbSchema', async (req: Request, res: Response) => {
        const connection = getMainDatabase().getConnectionObject();
        await connection.dropAllSchemas();
        await connection.sync({alter: true, logging: console.log, force: true});
        res.json({status: 'ok'});
    });

    router.get('/createVM', async (req: Request, res: Response) => {
        await getDefaultWorker().applyStrategy();
        res.json({status: 'ok'});
    });
    debugApp.use(router);
    exports['debug'] = functions.https.onRequest(debugApp);
}

function initializeApplication() {
    initializeDatabase();
    loadFunctions();
}

initializeApplication();
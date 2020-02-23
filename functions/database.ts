import * as admin from 'firebase-admin';
import {Sequelize, Transaction} from 'sequelize';

export const defaultConfig = {
    credential: admin.credential.cert('./serviceAccountKey.json'), 
} as admin.AppOptions;
admin.initializeApp(defaultConfig);

// TODO: Firestore should be an implementation of NonRelationalDatabase interface
export const firebaseAdmin = admin;
export const firestore = admin.firestore();
export const firebaseApp = admin.auth();

export interface RelationalDatabase {
    getConnectionObject(): any;
    executeTransaction(callback: Function): Promise<any>;
}

export class SQLiteDatabase implements RelationalDatabase {
    private static dbConnection: Sequelize = new Sequelize('sqlite:gami.db', {
        logging: console.log,
    });

    public getConnectionObject(): any {
        return SQLiteDatabase.dbConnection;
    }

    public executeTransaction(callback: (transaction: Transaction) => Promise<any>): Promise<any> {
        return SQLiteDatabase.dbConnection.transaction(callback);
    }
}

export class GoogleMySQLDatabase implements RelationalDatabase {
    private static dbConnection: Sequelize = new Sequelize('gami', 'gami', 'qwerty123456', {
        //host: '35.233.1.255',
        //port: 3306,
        dialect: 'mysql', 
        dialectOptions: {
            socketPath: '/cloudsql/gamibackend:europe-west1:gamidatabase',
        }
    });
    public getConnectionObject(): any {
        return GoogleMySQLDatabase.dbConnection;
    }

    public executeTransaction(callback: (transaction: Transaction) => Promise<any>): Promise<any> {
        return GoogleMySQLDatabase.dbConnection.transaction(callback);
    }
}

let defaultMainDatabase: RelationalDatabase = new GoogleMySQLDatabase();

export function setMainDatabase(newDatabase: RelationalDatabase) {
    defaultMainDatabase = newDatabase;
} 

export function getMainDatabase(): RelationalDatabase {
    return defaultMainDatabase;
}
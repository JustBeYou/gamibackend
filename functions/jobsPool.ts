import {firestore} from './database';
import {uuid} from 'uuidv4';

export interface JobsPool<T> {
    add(job: T): Promise<void>;
    extract(): Promise<T>;
    isEmpty(): Promise<boolean>;
    count(): Promise<number>;
    getConnectionString(): string;
}

export class FirestoreJobsPool<T> implements JobsPool<T> {
    public async add(job: T) {
        await firestore.collection('queue').doc(uuid()).set(job);
        return Promise.resolve();
    }

    public getConnectionString() {
        return 'firestore:queue';
    }

    public extract() {
        throw new Error('This method is useless in the context of cloud functions.');
        return Promise.resolve({} as T);
    }

    public count() {
        throw new Error('This method is useless in the context of cloud functions.');
        return Promise.resolve(-1);
    }

    public isEmpty() {
        throw new Error('You should not use this method using Firestore!');
        return Promise.resolve(true);
    }
}

export class InMemoryJobsPool<T> implements JobsPool<T> {
    private store: Array<T>;

    public constructor() {
        this.store = [];
    }

    public add(job: T) {
        this.store.push(job);
        return Promise.resolve();
    }
    
    public extract() {
        const extracted = this.store.shift();
        if (extracted === undefined) throw new Error('Empty jobs pool.');
        return Promise.resolve(extracted);
    }

    public isEmpty() {
        return Promise.resolve(this.store.length === 0);
    }

    public count() {
        return Promise.resolve(this.store.length);
    }

    public getConnectionString() {
        //throw new Error('Not relevant in testing environment.');
        return 'Fake jobs pool';
    }
}


export interface Worker {
    startNewInstance(): Promise<void>;
    isRunning(): Promise<boolean>;
    applyStrategy(): Promise<void>;
}
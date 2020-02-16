export interface JobsPool<T> {
    add(job: T): Promise<void>;
    extract(): Promise<T>;
    isEmpty(): Promise<boolean>;
    count(): Promise<number>;
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
}


export interface Worker {
    startNewInstance(): Promise<void>;
    isRunning(): Promise<boolean>;
    applyStrategy(): Promise<void>;
}
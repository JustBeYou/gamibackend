export interface KeyValueCache<K, V> {
    get(key: K): Promise<V>;
    set(key: K, value: V): Promise<void>;
    unset(key: K): Promise<void>;
    contains(key: K): Promise<boolean>;
}

// TODO: implement Caching using a service
// In memory caching won't work on Google Cloud Functions
type InMemoryCacheStore<V> = {
    [key: string]: V,
};
export class InMemoryCache<V> implements KeyValueCache<string, V> {
    private store: InMemoryCacheStore<V>;

    public constructor() {
        this.store = {} as InMemoryCacheStore<V>;
    }
    
    public get(key: string) {
        if (this.store[key] === undefined) throw new Error(`Key ${key} not found.`);
        return Promise.resolve(this.store[key]);
    }

    public set(key: string, value: V) {
        this.store[key] = value;
        return Promise.resolve();
    }

    public unset(key: string) {
        if (this.store[key] === undefined) throw new Error(`Key ${key} not found.`);
        delete this.store[key];
        return Promise.resolve();
    }

    public contains(key: string) {
        return Promise.resolve(this.store[key] !== undefined);
    }
}
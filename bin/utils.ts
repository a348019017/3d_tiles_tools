export type Indexer<T> = { [key: string]: T };
export function map<T, U>(obj: Indexer<T> | undefined, f: (value: T, id: string) => U): Indexer<U> {
    return Object.keys(obj || {}).reduce((newObj, key) => {
        newObj[key] = f(obj![key], key);
        return newObj;
    }, <Indexer<U>>{});
}

export function* enumerate<T>(obj?: Indexer<T>): IterableIterator<[string, T]> {
    for (let key of Object.keys(obj || {})) {
        yield [key, obj![key]];
    }
}

export function first<T>(obj: Indexer<T>): T | undefined {
    return obj[Object.keys(obj)[0]];
}
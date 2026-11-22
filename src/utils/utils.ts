/**
 * Recursively freezes an object and all its own data properties.
 *
 * Prevents modifications to the object and its nested values.
 * Primitive values are returned unchanged.
 *
 * @template T - The type of the value being frozen.
 * @param value - The value to freeze.
 * @returns The same value with its object structure frozen.
 */
export function deepFreeze<T>(value: T): T {
    const visited = new WeakSet<object>();

    function freeze(current: unknown): void {
        if (current === null || typeof current !== 'object' || visited.has(current)) {
            return;
        }

        visited.add(current);

        for (const key of Reflect.ownKeys(current)) {
            const descriptor = Reflect.getOwnPropertyDescriptor(current, key);
            if (descriptor && 'value' in descriptor) {
                freeze(descriptor.value);
            }
        }

        Object.freeze(current);
    }

    freeze(value);
    return value;
}

/**
 * Creates a deep immutable clone of a value.
 *
 * Uses structuredClone() to create an independent copy, then
 * recursively freezes the cloned object.
 *
 * @template V - The type of the value being cloned.
 * @param value - The object or array to clone.
 * @returns A deeply frozen clone of the input value.
 * @throws {TypeError} If the input is null or not an object.
 */
export function structuredImmutableClone<V>(value: V): V {
    if (value === null || typeof value !== 'object') {
        throw new TypeError('structuredImmutableClone only supports plain objects and arrays.');
    }

    const clone = structuredClone(value);
    return deepFreeze(clone);
}

/**
 * Determines whether a value can be recursively wrapped by a Proxy.
 *
 * Supports plain objects, null-prototype objects, and standard arrays.
 * Excludes class instances and built-in objects with custom prototypes.
 *
 * @param value - The value to check.
 * @returns True if the value is a supported trackable object.
 */
export function isTrackable(value: unknown): value is object {
    if (value === null || typeof value !== 'object') {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);

    return Array.isArray(value)
        ? prototype === Array.prototype
        : prototype === Object.prototype || prototype === null;
}

/**
 * Compares two property descriptors for equality.
 *
 * Checks their configurable, enumerable, writable, and value fields.
 * Returns true when both descriptors are undefined.
 *
 * @param a - The first property descriptor.
 * @param b - The second property descriptor.
 * @returns True if both descriptors have matching properties.
 */
export function sameDescriptor(
    a: PropertyDescriptor | undefined,
    b: PropertyDescriptor | undefined
): boolean {
    if (!a || !b) return a === b;

    if (
        a.configurable !== b.configurable
        || a.enumerable !== b.enumerable
    ) {
        return false;
    }

    const aIsData = 'value' in a || 'writable' in a;
    const bIsData = 'value' in b || 'writable' in b;

    if (aIsData !== bIsData) return false;

    if (aIsData) {
        return a.writable === b.writable && Object.is(a.value, b.value);
    }

    return a.get === b.get && a.set === b.set;
}

/**
 * Recursively compares two values for structural equality.
 *
 * Compares object prototypes, own properties, property descriptors,
 * and nested values. Primitive values are compared using Object.is().
 *
 * @param a - First value to compare.
 * @param b - Second value to compare.
 * @returns True if both values are structurally equal; otherwise false.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true;
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

    const keysA = Reflect.ownKeys(a);
    const keysB = Reflect.ownKeys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) {
            return false;
        }

        const da = Reflect.getOwnPropertyDescriptor(a, key)!;
        const db = Reflect.getOwnPropertyDescriptor(b, key)!;

        if (
            da.configurable !== db.configurable ||
            da.enumerable !== db.enumerable ||
            ('value' in da) !== ('value' in db)
        ) return false;

        if ('value' in da && 'value' in db) {
            if (
                da.writable !== db.writable ||
                !deepEqual(da.value, db.value)
            ) return false;
        } else if (da.get !== db.get || da.set !== db.set) {
            return false;
        }
    }

    return true;
}

/**
 * An asynchronous mutex that ensures only one operation executes
 * within a critical section at a time.
 *
 * Concurrent operations are placed in a FIFO queue and granted access
 * sequentially as the current operation releases the lock.
 */
export class AsyncMutex {
    #locked = false;
    #queue: Array<() => void> = [];

    /**
     * Acquires the mutex, waiting if another operation holds the lock.
     *
     * @returns A release function that unlocks the mutex and allows
     *          the next queued operation to proceed.
     */
    async acquire(): Promise<() => void> {
        if (this.#locked) {
            await new Promise<void>((resolve) => {
                this.#queue.push(resolve);
            });
        } else {
            this.#locked = true;
        }

        let released = false;

        return () => {
            if (released) return;
            released = true;

            const next = this.#queue.shift();

            if (next) {
                next();
            } else {
                this.#locked = false;
            }
        };
    }

    /**
     * Executes a callback while holding the mutex.
     *
     * Automatically releases the lock after completion, even if
     * the callback throws an error or rejects.
     *
     * @template T - The callback's return type.
     * @param callback - Synchronous or asynchronous operation to execute.
     * @returns A promise resolving to the callback's result.
     */
    async runExclusive<T>(
        callback: () => Promise<T> | T,
    ): Promise<T> {
        const release = await this.acquire();

        try {
            return await callback();
        } finally {
            release();
        }
    }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

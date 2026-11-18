export function deepFreeze<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    for (const key of Object.keys(value)) {
        deepFreeze(value[key as keyof T]);
    }

    return Object.freeze(value);
}

export function structuredImmutableClone<V>(value: V): V {
    if (value === null || typeof value !== 'object') {
        throw new TypeError('structuredImmutableClone only supports plain objects and arrays.');
    }

    const clone = structuredClone(value);
    return deepFreeze(clone);
}

export function isTrackable(value: unknown): value is object {
    if (value === null || typeof value !== 'object') {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);

    return Array.isArray(value)
        ? prototype === Array.prototype
        : prototype === Object.prototype || prototype === null;
}

export function sameDescriptor(a: PropertyDescriptor | undefined, b: PropertyDescriptor | undefined): boolean {
    if (!a || !b) return a === b;

    return (
        a.configurable === b.configurable
        && a.enumerable === b.enumerable
        && a.writable === b.writable
        && Object.is(a.value, b.value)
    );
}
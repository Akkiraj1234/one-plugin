import {
    deepFreeze,
    structuredImmutableClone,
    isTrackable,
    sameDescriptor
} from './utils';


function createProxy<T>(
    target: T,
    onChange: () => void,
) {

}

export class DirtyObject<T extends object> {
    readonly #OrignalObject: T;
    readonly #proxy: T;

    private version = 0;
    private cleanVersion = 0;

    constructor(value: T) {
        this.#OrignalObject = structuredImmutableClone(value) as T;
        this.#proxy = createProxy(
            this.#OrignalObject,
            () => this.version++
        ) as T;
    }

    onChange() {
        this.version++;
    }

    get(): T {
        return this.#proxy;
    }
}



export class DirtyObject1<T extends object> {
    readonly #target: T;
    readonly #proxy: T;

    private version = 0;
    private cleanVersion = 0;

    private proxyCache = new WeakMap<object, object>();
    private proxyTargets = new WeakMap<object, object>();

    constructor(value: T) {
        this.#target = this.clone(value);
        this.#proxy = this.createProxy(this.#target) as T;
    }

    get value(): T {
        return this.#proxy;
    }

    get isDirty(): boolean {
        return this.version !== this.cleanVersion;
    }

    markClean(): void {
        this.cleanVersion = this.version;
    }

    getSnapshot(): T {
        return this.clone(this.#target);
    }

    /**
     * Creates an independent, mutable copy of supported data.
     *
     * Supports:
     * - Plain objects
     * - Arrays
     * - Nested objects and arrays
     * - Circular references
     * - Shared references
     *
     * Rejects:
     * - Frozen/sealed/non-extensible objects
     * - Accessor properties
     * - Non-plain object types
     * - Locked object-valued properties
     */
    private clone
    set(value: T): void {
        const rawValue = this.unwrap(value);

        if (!isTrackable(rawValue)) {
            throw new TypeError('DirtyObject only supports plain objects and arrays.');
        }

        if (Object.is(this.data, rawValue)) return;

        this.data = structuredClone(rawValue) as T;
        this.proxy = this.createProxy(this.data);
        this.version++;
    }

    snapshot(): { value: T; version: number } {
        return {
            value: structuredClone(this.data),
            version: this.version,
        };
    }

    markSaved(version: number): void {
        if (version === this.version) {
            this.savedVersion = version;
        }
    }

    private unwrap(value: unknown): unknown {
        if (value !== null && typeof value === 'object') {
            return this.proxyTargets.get(value) ?? value;
        }

        return value;
    }

    private createProxy<U extends object>(target: U): U {
        const existing = this.proxies.get(target);

        if (existing) {
            return existing as U;
        }

        const proxy = new Proxy(target, {
            get: (target, property) => {
                const descriptor = Reflect.getOwnPropertyDescriptor(
                    target,
                    property,
                );

                const value = Reflect.get(target, property, target);

                // Respect Proxy invariants for frozen properties.
                if (
                    descriptor
                    && descriptor.configurable === false
                    && 'value' in descriptor
                    && descriptor.writable === false
                ) {
                    return value;
                }

                return isTrackable(value)
                    ? this.createProxy(value)
                    : value;
            },

            set: (target, property, value) => {
                const nextValue = this.unwrap(value);
                const previousValue = Reflect.get(
                    target,
                    property,
                    target,
                );

                if (Object.is(previousValue, nextValue)) {
                    return true;
                }

                const success = Reflect.set(
                    target,
                    property,
                    nextValue,
                    target,
                );

                if (success) {
                    this.version++;
                }

                return success;
            },

            deleteProperty: (target, property) => {
                if (!Object.prototype.hasOwnProperty.call(target, property)) {
                    return true;
                }

                const success = Reflect.deleteProperty(target, property);

                if (success) {
                    this.version++;
                }

                return success;
            },

            defineProperty: (target, property, descriptor) => {
                const previous = Reflect.getOwnPropertyDescriptor(
                    target,
                    property,
                );

                const nextDescriptor = { ...descriptor };

                if ('value' in nextDescriptor) {
                    nextDescriptor.value = this.unwrap(nextDescriptor.value);
                }

                const success = Reflect.defineProperty(
                    target,
                    property,
                    nextDescriptor,
                );

                if (success) {
                    const current = Reflect.getOwnPropertyDescriptor(
                        target,
                        property,
                    );

                    if (!sameDescriptor(previous, current)) {
                        this.version++;
                    }
                }

                return success;
            },
        });

        this.proxies.set(target, proxy);
        this.proxyTargets.set(proxy, target);

        return proxy;
    }
}
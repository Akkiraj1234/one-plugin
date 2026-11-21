import {
    structuredImmutableClone,
    isTrackable,
    AsyncMutex,
    deepEqual
} from './utils';

interface DirtyChange {
    target: object;
    path: readonly PropertyKey[];
    operation: 'set' | 'delete' | 'define';
}

interface SharedProxyState {
    mutex: AsyncMutex;
    version: number;
    cleanVersion: number;
    onChange?: (change: DirtyChange) => void;
}


/**
 * Resolves internal helper methods exposed by a DirtyObject Proxy.
 *
 * These helpers provide access to cloned object data, structural comparison,
 * and the shared proxy state without exposing the underlying implementation
 * directly through the public API.
 *
 * @template T - The type of the target object.
 * @param target - The original object wrapped by the Proxy.
 * @param property - The property key being accessed.
 * @param state - Shared state used by the Proxy and its nested proxies.
 * @returns The requested helper function, or undefined if the property
 *          does not match an internal helper.
 */
function handleProxyFunction<T extends object>(
    target: T,
    property: PropertyKey,
    state: SharedProxyState
): ((...args: any[]) => unknown) | undefined {

    if (property === '___getOrignal') {
        return () => {
            return structuredImmutableClone(target);
        };
    }

    if (property === '___matchProxy') {
        return (other: unknown): boolean => {
            if (other !== null && typeof other === 'object') {
                const getOriginal = Reflect.get(
                    other,
                    '___getOrignal',
                );

                if (typeof getOriginal === 'function') {
                    other = getOriginal.call(other);
                }
            }

            return deepEqual(target, other);
        };
    }

    if (property === '___getState') {
        return () => state;
    }

    return undefined;
}

/**
 * Creates a recursive Proxy that tracks mutations to an object.
 *
 * Nested objects receive their own proxies but share the same state.
 * Each nested proxy maintains its path from the root object, allowing
 * mutations to report their complete location through onChange.
 *
 * @param target - Object to wrap with a Proxy.
 * @param state - Shared state used to track mutations.
 * @param path - Property path from the root to the current target.
 * @returns A Proxy that tracks property access and mutations.
 */
function createProxy<T extends object>(target: T, state: SharedProxyState, path: PropertyKey[] = []): T {
    return new Proxy(target, {

        /**
         * Intercepts property access on the target object.
         *
         * Retrieves the property value and checks its descriptor to preserve
         * JavaScript Proxy invariants. Internal helper methods are resolved
         * before checking whether the value needs to be wrapped.
         *
         * If the retrieved value is trackable, a new recursive Proxy is
         * created using the same shared state. Non-trackable values are
         * returned directly.
         *
         * @param target - The object whose property is being accessed.
         * @param property - The property key being accessed.
         * @returns The original value, an internal helper, or a nested Proxy.
         */
        get(target, property) {
            const value = Reflect.get(target, property, target);
            const descriptor = Reflect.getOwnPropertyDescriptor(
                target,
                property
            )

            if (
                descriptor?.configurable === false &&
                'value' in descriptor &&
                descriptor.writable === false
            ) {
                return value;
            }

            const helper = handleProxyFunction(
                target,
                property,
                state
            );
            if (helper) return helper;
            if (isTrackable(value)) {
                return createProxy(value, state, [...path, property]);
            }

            return value;
        },

        /**
         * Intercepts property assignments.
         *
         * Compares the existing value with the incoming value to avoid
         * unnecessary updates when both are identical.
         *
         * After a successful assignment, increments the shared version
         * and invokes the registered change callback with the target object,
         * mutation path, and operation type.
         *
         * @param target - The object receiving the assignment.
         * @param property - The property key being modified.
         * @param value - The new value being assigned.
         * @returns True if the assignment succeeds; otherwise false.
         */
        set(target, property, value) {
            const previous = Reflect.get(target, property, target);
            if (Object.is(previous, value)) return true;

            const success = Reflect.set(
                target,
                property,
                value,
                target,
            );

            if (success) {
                state.version++;
                state.onChange?.({
                    target,
                    path: [...path, property],
                    operation: "set"
                });
            }

            return success;
        },

        /**
         * Intercepts property deletion.
         *
         * Checks whether the property exists before attempting deletion.
         * A successful deletion increments the shared version and invokes
         * the registered change callback with the target object,
         * mutation path, and operation type.
         *
         * @param target - The object containing the property.
         * @param property - The property key being deleted.
         * @returns True if the deletion succeeds; otherwise false.
         */
        deleteProperty(target, property) {
            if (!Reflect.has(target, property)) {
                return true;
            }

            const success = Reflect.deleteProperty(
                target,
                property,
            );

            if (success) {
                state.version++;
                state.onChange?.({
                    target,
                    path: [...path, property],
                    operation: "delete"
                });
            }

            return success;
        },

        /**
         * Intercepts property definitions through Object.defineProperty().
         *
         * Delegates the definition to Reflect.defineProperty(). When the
         * operation succeeds, updates the shared version and invokes the
         * registered change callback with the target object,
         * mutation path, and operation type.
         *
         * @param target - The object receiving the property definition.
         * @param property - The property key being defined.
         * @param descriptor - The descriptor used to define the property.
         * @returns True if the property definition succeeds; otherwise false.
         */
        defineProperty(target, property, descriptor) {
            const success = Reflect.defineProperty(
                target,
                property,
                descriptor,
            );

            if (success) {
                state.version++;
                state.onChange?.({
                    target,
                    path: [...path, property],
                    operation: "define"
                });
            }

            return success;
        },
    });
}


/**
 * Executes a callback exclusively using the DirtyObject's shared async mutex.
 *
 * Ensures that other protected operations on the same DirtyObject
 * wait until the callback completes, including asynchronous operations.
 *
 * @param proxy - Root proxy belonging to a DirtyObject.
 * @param callback - Operation to execute exclusively.
 * @returns A promise resolving to the callback's result.
 * @throws {TypeError} If the supplied proxy is invalid.
 *
 * @example
 * await safeDirty(proxy, async () => {
 *     proxy.student.marks = 95;
 *     await saveSomething();
 * });
 */
function safeDirty<R>(proxy: object, callback: () => R | Promise<R>): Promise<R> {
    const getState = Reflect.get(proxy, '___getState');

    if (typeof getState !== 'function') {
        throw new TypeError('Invalid DirtyObject proxy.');
    }

    const state = getState() as SharedProxyState;
    return state.mutex.runExclusive(async () => {
        return await callback();
    });
}


/**
 * DirtyObject
 *
 * A recursively tracked mutable object with centralized change tracking,
 * asynchronous synchronization, and snapshot-based persistence.
 *
 * DirtyObject creates a mutable copy of the supplied value and exposes
 * it through a root Proxy. All nested proxies operate on the same
 * underlying object and share the same state.
 *
 * Any successful mutation through the proxy updates the shared version
 * and marks the object as dirty. Mutation details are reported through
 * the optional onChange callback.
 * Mutation paths identify the complete location of a change
 * relative to the root object, including nested properties.
 *
 * The root proxy can be shared across multiple parts of an application.
 * Consumers can modify nested properties without managing individual
 * proxies or maintaining separate dirty states.
 *
 * @typeParam T - The shape of the managed object.
 *
 * @example
 * const student = new DirtyObject({
 *     arjun: { marks: 80 },
 *     priya: { marks: 90 },
 * });
 *
 * const proxy = student.get();
 *
 * // Synchronous modifications.
 * proxy.arjun.marks = 95;
 *
 * console.log(student.isDirty); // true
 *
 * // Asynchronous modifications.
 * await student.safeDirty(async (data) => {
 *     data.priya.marks = 98;
 *     await someAsyncOperation();
 * });
 *
 * // Persist and clean the object.
 * await student.save(async (snapshot) => {
 *     await database.save(snapshot);
 * });
 *
 * console.log(student.isDirty); // false
 */
class DirtyObject<T extends object> {
    readonly #current: T;
    readonly #proxy: T;
    readonly #state: SharedProxyState;

    #savedSnapshot: T;

    /**
     * Creates a new DirtyObject.
     *
     * The supplied value is cloned to create an independent mutable
     * working object. Changes made through the proxy do not modify
     * the original value passed to the constructor.
     *
     * Initially, the object is clean.
     *
     * @param value - Initial data to manage.
     * @param onChange - Optional callback invoked after a successful
     * mutation through the proxy. Receives a DirtyChange object containing
     * the mutated target object, complete property path, and operation type.
     *
     * @example
     * const dirty = new DirtyObject(
     *     { name: 'Akki', age: 22 },
     *     () => console.log('Object changed'),
     * );
     */
    constructor(value: T, onChange?: (change: DirtyChange) => void) {
        this.#current = structuredClone(value);
        this.#savedSnapshot = structuredClone(value);

        this.#state = {
            mutex: new AsyncMutex(),
            version: 0,
            cleanVersion: 0,
            onChange,
        };

        this.#proxy = createProxy(
            this.#current,
            this.#state,
        );
    }

    /**
     * Returns the root proxy.
     *
     * The returned proxy behaves like the original object and supports
     * normal property access, assignment, deletion, and nested access.
     *
     * Every nested proxy operates on the same underlying root data
     * and shares its dirty tracking state.
     *
     * Synchronous mutations can be performed directly without
     * acquiring the asynchronous mutex.
     *
     * For operations spanning asynchronous boundaries, use safeDirty().
     *
     * @returns The root mutable proxy.
     *
     * @example
     * const proxy = dirty.get();
     *
     * proxy.student.name = 'Akki';
     * proxy.settings.theme = 'dark';
     */
    get(): T {
        return this.#proxy;
    }

    /**
     * Executes an operation exclusively using the shared async mutex.
     *
     * The mutex prevents other safeDirty(), save(), markClean(),
     * and getSnapshot() operations from running concurrently.
     *
     * The lock remains held until the callback finishes, including
     * any asynchronous operations awaited inside it.
     *
     * All nested proxy mutations participate in the same
     * synchronization boundary.
     *
     * This method is optional for purely synchronous operations.
     * It should be used when an asynchronous operation reads or
     * modifies shared data across await boundaries.
     *
     * @typeParam R - Callback return type.
     * @param callback - Operation receiving the root proxy.
     * @returns A promise resolving to the callback result.
     *
     * @example
     * await dirty.safeDirty(async (proxy) => {
     *     proxy.student.marks = 95;
     *
     *     await fetchSomething();
     *
     *     proxy.student.status = 'updated';
     * });
     *
     * @example
     * // Multiple operations are serialized.
     * await Promise.all([
     *     dirty.safeDirty(async (proxy) => {
     *         proxy.student.arjun.marks = 95;
     *         await operationA();
     *     }),
     *     dirty.safeDirty(async (proxy) => {
     *         proxy.student.priya.marks = 98;
     *         await operationB();
     *     }),
     * ]);
     */
    async safeDirty<R>(callback: (proxy: T) => R | Promise<R>): Promise<R> {
        return this.#state.mutex.runExclusive(
            () => callback(this.#proxy),
        );
    }

    /**
     * Indicates whether the object contains unsaved changes.
     *
     * The object is considered dirty whenever its current version
     * differs from its last clean version.
     *
     * @returns True if the object has changed since its last
     * successful save or clean operation.
     *
     * @example
     * if (dirty.isDirty) {
     *     console.log('Unsaved changes detected');
     * }
     */
    get isDirty(): boolean {
        return (
            this.#state.version !==
            this.#state.cleanVersion
        );
    }

    /**
     * Returns the current modification version.
     *
     * The version increments after every successful tracked mutation,
     * including nested property assignments, deletions, and
     * property descriptor changes.
     *
     * @returns Current modification version.
     *
     * @example
     * console.log(dirty.version);
     */
    get version(): number {
        return this.#state.version;
    }

    /**
     * Marks the current object state as clean.
     *
     * Acquires the shared mutex before updating the saved snapshot
     * and clean version.
     *
     * This does not persist data to external storage.
     * It only updates DirtyObject's internal clean state.
     *
     * @returns A promise resolving when the object is marked clean.
     *
     * @example
     * await dirty.markClean();
     *
     * console.log(dirty.isDirty); // false
     */
    async markClean(): Promise<void> {
        await this.#state.mutex.runExclusive(() => {
            this.#savedSnapshot = structuredClone(
                this.#current,
            );

            this.#state.cleanVersion =
                this.#state.version;
        });
    }

    /**
     * Alias for markClean().
     *
     * Performs the same operation as markClean(), marking the
     * current state as clean and updating the saved snapshot.
     *
     * Because sometimes objects need a little spiritual cleansing.
     *
     * @returns A promise resolving when the object is clean.
     *
     * @example
     * await dirty.holly();
     *
     * console.log(dirty.isDirty); // false
     */
    async holly(): Promise<void> {
        await this.markClean();
    }

    /**
     * Returns an immutable snapshot of the current object state.
     *
     * Acquires the shared mutex to ensure the snapshot is created
     * without another protected operation modifying the data.
     *
     * The returned snapshot is independent of the working object.
     *
     * @returns A promise resolving to an immutable snapshot.
     *
     * @example
     * const snapshot = await dirty.getSnapshot();
     */
    async getSnapshot(): Promise<Readonly<T>> {
        return this.#state.mutex.runExclusive(() => {
            return structuredImmutableClone(
                this.#current,
            );
        });
    }

    /**
     * Returns the most recently saved or manually cleaned snapshot.
     *
     * Unlike getSnapshot(), this method does not acquire the mutex.
     * It returns a clone of the last stored snapshot, not the
     * current working data.
     *
     * @returns A copy of the last saved snapshot.
     *
     * @example
     * const lastSaved = dirty.getSavedSnapshot();
     */
    getSavedSnapshot(): Readonly<T> {
        return structuredImmutableClone(
            this.#savedSnapshot,
        );
    }

    /**
     * Persists the current object state and marks it clean.
     *
     * Acquires the shared mutex for the entire persistence operation.
     *
     * A snapshot is created and passed to the persistence callback.
     * The object is marked clean and its saved snapshot is updated
     * only after the callback completes successfully.
     *
     * If persistence fails, the error is propagated and the previous
     * saved snapshot and clean version are preserved.
     *
     * @param persist - Function responsible for persisting the snapshot.
     *
     * @returns A promise resolving after successful persistence.
     *
     * @throws Propagates errors thrown by the persistence callback.
     *
     * @example
     * await dirty.save(async (snapshot) => {
     *     await database.save(snapshot);
     * });
     *
     * console.log(dirty.isDirty); // false
     *
     * @example
     * // Handle persistence failures.
     * try {
     *     await dirty.save(async (snapshot) => {
     *         await database.save(snapshot);
     *     });
     * } catch (error) {
     *     console.error('Failed to save object:', error);
     * }
     */
    async save(persist: (snapshot: Readonly<T>) => void | Promise<void>): Promise<void> {
        await this.#state.mutex.runExclusive(async () => {
            const snapshot = structuredImmutableClone(
                this.#current,
            );

            await persist(snapshot);

            this.#savedSnapshot = structuredClone(
                this.#current,
            );

            this.#state.cleanVersion =
                this.#state.version;
        });
    }
}

export {
    safeDirty,
    DirtyObject,
    type SharedProxyState,
    type DirtyChange
}

/* eslint-disable import/no-nodejs-modules */
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

const bundle = await build({
    stdin: {
        contents: [
            "import './src/utils/index';",
            "export * from './src/utils/utils';",
            "export * from './src/utils/dirtyObj';",
        ].join('\n'),
        resolveDir: root,
        sourcefile: 'utilities-test-entry.ts',
        loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
});

const utilities = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

const {
    AsyncMutex,
    DirtyObject,
    deepEqual,
    deepFreeze,
    isTrackable,
    safeDirty,
    sameDescriptor,
    structuredImmutableClone,
} = utilities;

function deferred() {
    let resolve;
    let reject;

    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });

    return { promise, resolve, reject };
}

// ============================================================
// MODULE AND EXPORTS
// ============================================================

void test('utilities barrel and source modules bundle successfully', async () => {
    assert.equal(typeof DirtyObject, 'function');
    assert.equal(typeof AsyncMutex, 'function');
    assert.equal(typeof structuredImmutableClone, 'function');
});

// ============================================================
// DEEP FREEZE
// ============================================================

void test('deepFreeze preserves primitives and recursively freezes objects and arrays', () => {
    assert.equal(deepFreeze(null), null);
    assert.equal(deepFreeze('value'), 'value');
    assert.equal(deepFreeze(42), 42);
    assert.equal(deepFreeze(undefined), undefined);
    assert.equal(deepFreeze(true), true);

    const value = {
        items: [{ label: 'first' }],
        metadata: { active: true },
    };

    const frozen = deepFreeze(value);

    assert.equal(frozen, value);
    assert.ok(Object.isFrozen(frozen));
    assert.ok(Object.isFrozen(frozen.items));
    assert.ok(Object.isFrozen(frozen.items[0]));
    assert.ok(Object.isFrozen(frozen.metadata));

    assert.throws(() => {
        frozen.items[0].label = 'changed';
    }, TypeError);
});

void test('deepFreeze handles circular references', () => {
    const value = { name: 'cycle' };
    value.self = value;

    assert.doesNotThrow(() => deepFreeze(value));
    assert.equal(value.self, value);
    assert.ok(Object.isFrozen(value));
});

void test('deepFreeze freezes symbol-keyed and non-enumerable data properties', () => {
    const symbol = Symbol('nested');
    const hidden = { value: 1 };
    const symbolValue = { value: 2 };
    const value = {};

    Object.defineProperty(value, 'hidden', {
        value: hidden,
        enumerable: false,
        configurable: true,
    });

    value[symbol] = symbolValue;

    deepFreeze(value);

    assert.ok(Object.isFrozen(value));
    assert.ok(Object.isFrozen(hidden));
    assert.ok(Object.isFrozen(symbolValue));
});

void test('deepFreeze does not invoke getters', () => {
    let getterCalls = 0;

    const value = Object.defineProperty({}, 'nested', {
        enumerable: true,
        configurable: true,
        get() {
            getterCalls++;
            return { value: 1 };
        },
    });

    deepFreeze(value);

    assert.equal(getterCalls, 0);
    assert.ok(Object.isFrozen(value));
});

void test('deepFreeze handles already frozen objects', () => {
    const value = Object.freeze({
        nested: Object.freeze({ value: 1 }),
    });

    assert.doesNotThrow(() => deepFreeze(value));
    assert.ok(Object.isFrozen(value.nested));
});

// ============================================================
// STRUCTURED IMMUTABLE CLONE
// ============================================================

void test('structuredImmutableClone rejects non-objects', () => {
    for (const value of [null, undefined, 'text', 1, true]) {
        assert.throws(
            () => structuredImmutableClone(value),
            TypeError,
        );
    }
});

void test('structuredImmutableClone returns an independent frozen clone', () => {
    const input = {
        list: [1, { value: 2 }],
    };

    const clone = structuredImmutableClone(input);

    assert.deepEqual(clone, input);
    assert.notEqual(clone, input);
    assert.notEqual(clone.list, input.list);

    assert.ok(Object.isFrozen(clone));
    assert.ok(Object.isFrozen(clone.list));
    assert.ok(Object.isFrozen(clone.list[1]));

    input.list[1].value = 3;

    assert.equal(clone.list[1].value, 2);
});

void test('structuredImmutableClone preserves circular references', () => {
    const value = { name: 'cycle' };
    value.self = value;

    const clone = structuredImmutableClone(value);

    assert.notEqual(clone, value);
    assert.equal(clone.self, clone);
    assert.ok(Object.isFrozen(clone));
});

void test('structuredImmutableClone follows structuredClone symbol-key behavior', () => {
    const symbol = Symbol('nested');
    const value = { name: 'test' };

    value[symbol] = { value: 10 };

    const clone = structuredImmutableClone(value);

    assert.equal(Object.hasOwn(clone, symbol), false);
});

void test('structuredImmutableClone throws when structured cloning is unsupported', () => {
    const value = {
        callback: () => undefined,
    };

    assert.throws(() => structuredImmutableClone(value));
});

// ============================================================
// IS TRACKABLE
// ============================================================

void test('isTrackable accepts plain objects, null-prototype objects, and arrays', () => {
    assert.equal(isTrackable({}), true);
    assert.equal(isTrackable(Object.create(null)), true);
    assert.equal(isTrackable([]), true);
    assert.equal(
        isTrackable(Object.create(Object.prototype)),
        true,
    );
});

void test('isTrackable rejects primitives and unsupported values', () => {
    assert.equal(isTrackable(null), false);
    assert.equal(isTrackable(undefined), false);
    assert.equal(isTrackable(1), false);
    assert.equal(isTrackable('value'), false);
    assert.equal(isTrackable(true), false);
    assert.equal(isTrackable(10n), false);
    assert.equal(isTrackable(Symbol('value')), false);
    assert.equal(isTrackable(() => undefined), false);
});

void test('isTrackable rejects built-in objects and custom instances', () => {
    class Custom { }

    class CustomArray extends Array { }

    assert.equal(isTrackable(new Date()), false);
    assert.equal(isTrackable(new Map()), false);
    assert.equal(isTrackable(new Set()), false);
    assert.equal(isTrackable(new Custom()), false);
    assert.equal(isTrackable(new CustomArray()), false);
    assert.equal(isTrackable(Object.create({ value: 1 })), false);
});

// ============================================================
// SAME DESCRIPTOR
// ============================================================

void test('sameDescriptor handles missing descriptors', () => {
    assert.equal(sameDescriptor(undefined, undefined), true);
    assert.equal(sameDescriptor(undefined, { value: 1 }), false);
    assert.equal(sameDescriptor({ value: 1 }, undefined), false);
});

void test('sameDescriptor compares data descriptor values using Object.is', () => {
    assert.equal(
        sameDescriptor(
            {
                configurable: true,
                enumerable: true,
                writable: true,
                value: Number.NaN,
            },
            {
                configurable: true,
                enumerable: true,
                writable: true,
                value: Number.NaN,
            },
        ),
        true,
    );

    assert.equal(
        sameDescriptor(
            {
                configurable: true,
                enumerable: true,
                writable: true,
                value: 0,
            },
            {
                configurable: true,
                enumerable: true,
                writable: true,
                value: -0,
            },
        ),
        false,
    );
});

void test('sameDescriptor compares descriptor flags', () => {
    const first = {
        configurable: true,
        enumerable: true,
        writable: true,
        value: 1,
    };

    assert.equal(
        sameDescriptor(first, {
            ...first,
            configurable: false,
        }),
        false,
    );

    assert.equal(
        sameDescriptor(first, {
            ...first,
            enumerable: false,
        }),
        false,
    );

    assert.equal(
        sameDescriptor(first, {
            ...first,
            writable: false,
        }),
        false,
    );
});

void test('sameDescriptor compares accessor getter and setter references', () => {
    const getter = () => 10;
    const setter = (_value) => undefined;

    const first = {
        configurable: true,
        enumerable: true,
        get: getter,
        set: setter,
    };

    assert.equal(sameDescriptor(first, { ...first }), true);

    assert.equal(
        sameDescriptor(first, {
            ...first,
            get: () => 10,
        }),
        false,
    );

    assert.equal(
        sameDescriptor(first, {
            ...first,
            set: undefined,
        }),
        false,
    );
});

void test('sameDescriptor distinguishes data and accessor descriptors', () => {
    const data = {
        configurable: true,
        enumerable: true,
        writable: true,
        value: undefined,
    };

    const accessor = {
        configurable: true,
        enumerable: true,
        get: undefined,
        set: undefined,
    };

    assert.equal(sameDescriptor(data, accessor), false);
});

// ============================================================
// DEEP EQUAL
// ============================================================

void test('deepEqual compares primitives using Object.is', () => {
    assert.equal(deepEqual(Number.NaN, Number.NaN), true);
    assert.equal(deepEqual(0, -0), false);
    assert.equal(deepEqual('same', 'same'), true);
    assert.equal(deepEqual(true, true), true);
    assert.equal(deepEqual(null, null), true);

    assert.equal(deepEqual(null, {}), false);
    assert.equal(deepEqual(undefined, null), false);
    assert.equal(deepEqual(1, '1'), false);
});

void test('deepEqual distinguishes different prototypes', () => {
    assert.equal(deepEqual({}, Object.create(null)), false);
    assert.equal(deepEqual([], {}), false);
});

void test('deepEqual compares nested values independent of key insertion order', () => {
    assert.equal(
        deepEqual(
            {
                first: 1,
                nested: {
                    left: true,
                    right: [1, 2],
                },
            },
            {
                nested: {
                    right: [1, 2],
                    left: true,
                },
                first: 1,
            },
        ),
        true,
    );

    assert.equal(
        deepEqual({ value: 1 }, { value: 2 }),
        false,
    );

    assert.equal(
        deepEqual([1, 2], [2, 1]),
        false,
    );

    assert.equal(
        deepEqual([1], [1, 2]),
        false,
    );
});

void test('deepEqual compares symbol and non-enumerable properties', () => {
    const symbol = Symbol('key');
    const first = {};
    const second = {};

    Object.defineProperty(first, 'hidden', {
        value: 1,
        enumerable: false,
        writable: true,
        configurable: true,
    });

    Object.defineProperty(second, 'hidden', {
        value: 1,
        enumerable: false,
        writable: true,
        configurable: true,
    });

    first[symbol] = 'value';
    second[symbol] = 'value';

    assert.equal(deepEqual(first, second), true);

    second[symbol] = 'different';

    assert.equal(deepEqual(first, second), false);
});

void test('deepEqual compares property descriptor flags', () => {
    const first = {};

    const second = {};

    Object.defineProperty(first, 'value', {
        value: 1,
        writable: true,
        configurable: true,
    });

    Object.defineProperty(second, 'value', {
        value: 1,
        writable: false,
        configurable: true,
    });

    assert.equal(deepEqual(first, second), false);

    Object.defineProperty(second, 'value', {
        value: 1,
        writable: true,
        configurable: false,
    });

    assert.equal(deepEqual(first, second), false);
});

void test('deepEqual compares accessor descriptors without invoking getters', () => {
    let getterCalls = 0;

    const getter = () => {
        getterCalls++;
        return 10;
    };

    const first = {};
    const second = {};

    Object.defineProperty(first, 'value', {
        get: getter,
        configurable: true,
    });

    Object.defineProperty(second, 'value', {
        get: getter,
        configurable: true,
    });

    assert.equal(deepEqual(first, second), true);
    assert.equal(getterCalls, 0);
});

void test('deepEqual distinguishes different accessor functions', () => {
    const first = {};
    const second = {};

    Object.defineProperty(first, 'value', {
        get: () => 10,
    });

    Object.defineProperty(second, 'value', {
        get: () => 10,
    });

    assert.equal(deepEqual(first, second), false);
});

void test('deepEqual distinguishes sparse arrays from arrays containing undefined', () => {
    const sparse = Array(1);
    const explicitUndefined = [undefined];

    assert.equal(
        deepEqual(sparse, explicitUndefined),
        false,
    );
});

void test('deepEqual compares null-prototype objects', () => {
    const first = Object.assign(
        Object.create(null),
        { nested: { value: 1 } },
    );

    const second = Object.assign(
        Object.create(null),
        { nested: { value: 1 } },
    );

    assert.equal(deepEqual(first, second), true);
});

void test('deepEqual compares function-valued properties by reference', () => {
    const callback = () => undefined;

    assert.equal(
        deepEqual({ callback }, { callback }),
        true,
    );

    assert.equal(
        deepEqual(
            { callback },
            { callback: () => undefined },
        ),
        false,
    );
});

// ============================================================
// ASYNC MUTEX
// ============================================================

void test('AsyncMutex serializes operations in FIFO order', async () => {
    const mutex = new AsyncMutex();
    const firstStarted = deferred();
    const releaseFirst = deferred();
    const events = [];

    const first = mutex.runExclusive(async () => {
        events.push('first:start');
        firstStarted.resolve();

        await releaseFirst.promise;

        events.push('first:end');

        return 'first-result';
    });

    await firstStarted.promise;

    const second = mutex.runExclusive(() => {
        events.push('second');
        return 'second-result';
    });

    const third = mutex.runExclusive(() => {
        events.push('third');
    });

    assert.deepEqual(events, ['first:start']);

    releaseFirst.resolve();

    assert.deepEqual(
        await Promise.all([first, second, third]),
        [
            'first-result',
            'second-result',
            undefined,
        ],
    );

    assert.deepEqual(
        events,
        ['first:start', 'first:end', 'second', 'third'],
    );
});

void test('AsyncMutex releases after synchronous throws and asynchronous rejection', async () => {
    const mutex = new AsyncMutex();

    await assert.rejects(
        () => mutex.runExclusive(() => {
            throw new Error('sync failure');
        }),
        /sync failure/,
    );

    await assert.rejects(
        () => mutex.runExclusive(async () => {
            throw new Error('async failure');
        }),
        /async failure/,
    );

    assert.equal(
        await mutex.runExclusive(() => 'available'),
        'available',
    );
});

void test('AsyncMutex release is idempotent', async () => {
    const mutex = new AsyncMutex();

    const release = await mutex.acquire();
    const entered = deferred();

    const queued = mutex.runExclusive(() => {
        entered.resolve();
    });

    release();
    release();

    await entered.promise;
    await queued;

    assert.equal(
        await mutex.runExclusive(() => 'unlocked'),
        'unlocked',
    );
});

void test('AsyncMutex direct acquire calls are queued and released in order', async () => {
    const mutex = new AsyncMutex();
    const events = [];

    const releaseFirst = await mutex.acquire();

    const second = mutex.acquire().then((release) => {
        events.push('second');
        release();
    });

    const third = mutex.acquire().then((release) => {
        events.push('third');
        release();
    });

    await Promise.resolve();

    assert.deepEqual(events, []);

    releaseFirst();

    await Promise.all([second, third]);

    assert.deepEqual(events, ['second', 'third']);
});

void test('AsyncMutex remains usable after a queued callback rejects', async () => {
    const mutex = new AsyncMutex();
    const firstStarted = deferred();
    const releaseFirst = deferred();
    const events = [];

    const first = mutex.runExclusive(async () => {
        firstStarted.resolve();

        await releaseFirst.promise;

        throw new Error('first failed');
    });

    await firstStarted.promise;

    const second = mutex.runExclusive(() => {
        events.push('second');
    });

    releaseFirst.resolve();

    await assert.rejects(first, /first failed/);
    await second;

    assert.deepEqual(events, ['second']);

    assert.equal(
        await mutex.runExclusive(() => 'available'),
        'available',
    );
});

void test('AsyncMutex handles callbacks returning undefined', async () => {
    const mutex = new AsyncMutex();

    const result = await mutex.runExclusive(() => undefined);

    assert.equal(result, undefined);
});

// ============================================================
// DIRTY OBJECT
// ============================================================

void test('DirtyObject clones initial data and tracks nested mutations', () => {
    const input = {
        profile: { name: 'Ada' },
        values: [1],
    };

    let changes = 0;

    const dirty = new DirtyObject(input, () => {
        changes += 1;
    });

    const proxy = dirty.get();

    assert.equal(dirty.isDirty, false);
    assert.notEqual(proxy, input);
    assert.notEqual(proxy.profile, input.profile);

    proxy.profile.name = 'Grace';

    assert.equal(dirty.isDirty, true);
    assert.equal(dirty.version, 1);
    assert.equal(input.profile.name, 'Ada');

    proxy.values.push(2);

    assert.deepEqual(proxy.values, [1, 2]);
    assert.equal(dirty.version, 2);

    delete proxy.profile.name;

    assert.equal(dirty.version, 3);

    delete proxy.missing;

    assert.equal(dirty.version, 3);

    Object.defineProperty(proxy, 'added', {
        value: true,
        writable: true,
        enumerable: true,
        configurable: true,
    });

    assert.equal(proxy.added, true);
    assert.equal(dirty.version, 4);
    assert.equal(changes, 4);
});

void test('DirtyObject returns the same root proxy on repeated get calls', () => {
    const dirty = new DirtyObject({
        nested: { value: 1 },
    });

    assert.equal(dirty.get(), dirty.get());
});

void test('DirtyObject creates nested proxies sharing mutation tracking', () => {
    const dirty = new DirtyObject({
        nested: {
            deeper: {
                value: 1,
            },
        },
    });

    const proxy = dirty.get();
    const nested = proxy.nested;

    assert.notEqual(proxy.nested, nested);

    nested.deeper.value = 2;

    assert.equal(proxy.nested.deeper.value, 2);
    assert.equal(dirty.version, 1);
    assert.equal(dirty.isDirty, true);
});

void test('DirtyObject ignores identical assignments', () => {
    const dirty = new DirtyObject({ value: 1 });
    const proxy = dirty.get();

    proxy.value = 1;

    assert.equal(dirty.version, 0);
    assert.equal(dirty.isDirty, false);
});

void test('DirtyObject records changes reverted to their original value', async () => {
    const dirty = new DirtyObject({ value: 1 });
    const proxy = dirty.get();

    proxy.value = 2;
    proxy.value = 1;

    assert.equal(dirty.version, 2);
    assert.equal(dirty.isDirty, true);

    await dirty.markClean();

    assert.equal(dirty.isDirty, false);
});

void test('DirtyObject does not track deletion of missing properties', () => {
    const dirty = new DirtyObject({ value: 1 });

    delete dirty.get().missing;

    assert.equal(dirty.version, 0);
    assert.equal(dirty.isDirty, false);
});

void test('DirtyObject tracks symbol-keyed property mutations', () => {
    const symbol = Symbol('value');

    const dirty = new DirtyObject({
        [symbol]: 1,
    });

    dirty.get()[symbol] = 2;

    assert.equal(dirty.version, 1);
    assert.equal(dirty.get()[symbol], 2);
});

void test('DirtyObject onChange receives one notification per tracked mutation', () => {
    let calls = 0;

    const dirty = new DirtyObject(
        { nested: { value: 1 } },
        () => calls++,
    );

    const proxy = dirty.get();

    proxy.nested.value = 2;
    proxy.nested.value = 2;

    delete proxy.nested.value;

    Object.defineProperty(proxy, 'extra', {
        value: true,
        configurable: true,
    });

    assert.equal(calls, 3);
    assert.equal(dirty.version, 3);
});

void test('DirtyObject snapshots are independent and deeply frozen', async () => {
    const dirty = new DirtyObject({
        nested: { value: 1 },
        items: [1],
    });

    dirty.get().nested.value = 2;

    const current = await dirty.getSnapshot();
    const savedBeforeClean = dirty.getSavedSnapshot();

    assert.equal(current.nested.value, 2);
    assert.equal(savedBeforeClean.nested.value, 1);

    assert.ok(Object.isFrozen(current));
    assert.ok(Object.isFrozen(current.nested));

    assert.throws(() => {
        current.nested.value = 3;
    }, TypeError);

    await dirty.holly();

    assert.equal(dirty.isDirty, false);
    assert.deepEqual(dirty.getSavedSnapshot(), current);
});

void test('DirtyObject markClean updates saved snapshot', async () => {
    const dirty = new DirtyObject({ value: 1 });

    dirty.get().value = 2;

    await dirty.markClean();

    assert.equal(dirty.isDirty, false);
    assert.deepEqual(dirty.getSavedSnapshot(), { value: 2 });
});

void test('DirtyObject holly is an alias for markClean', async () => {
    const dirty = new DirtyObject({ value: 1 });

    dirty.get().value = 2;

    await dirty.holly();

    assert.equal(dirty.isDirty, false);
    assert.deepEqual(dirty.getSavedSnapshot(), { value: 2 });
});

void test('DirtyObject save persists an immutable snapshot and marks clean', async () => {
    const dirty = new DirtyObject({
        nested: { count: 1 },
    });

    dirty.get().nested.count = 2;

    let persisted;

    await dirty.save(async (snapshot) => {
        persisted = snapshot;

        assert.ok(Object.isFrozen(snapshot));
        assert.ok(Object.isFrozen(snapshot.nested));
    });

    assert.equal(persisted.nested.count, 2);
    assert.equal(dirty.isDirty, false);

    assert.deepEqual(
        dirty.getSavedSnapshot(),
        { nested: { count: 2 } },
    );
});

void test('DirtyObject failed save retains dirty and saved state', async () => {
    const dirty = new DirtyObject({ value: 1 });

    dirty.get().value = 2;

    await assert.rejects(
        () => dirty.save(async () => {
            throw new Error('storage unavailable');
        }),
        /storage unavailable/,
    );

    assert.equal(dirty.isDirty, true);
    assert.deepEqual(dirty.getSavedSnapshot(), { value: 1 });
    assert.equal((await dirty.getSnapshot()).value, 2);
});

void test('DirtyObject safeDirty returns callback results', async () => {
    const dirty = new DirtyObject({ value: 0 });

    const result = await dirty.safeDirty((proxy) => {
        proxy.value = 1;
        return 'completed';
    });

    assert.equal(result, 'completed');
    assert.equal(dirty.get().value, 1);
});

void test('DirtyObject safeDirty releases the lock after rejection', async () => {
    const dirty = new DirtyObject({ value: 0 });

    await assert.rejects(
        () => dirty.safeDirty(async () => {
            throw new Error('operation failed');
        }),
        /operation failed/,
    );

    await dirty.safeDirty((proxy) => {
        proxy.value = 2;
    });

    assert.equal(dirty.get().value, 2);
    assert.equal(dirty.isDirty, true);
});

void test('safeDirty rejects invalid proxies', () => {
    assert.throws(
        () => safeDirty({}, () => undefined),
        TypeError,
    );

    assert.throws(
        () => safeDirty(null, () => undefined),
        TypeError,
    );
});

void test('DirtyObject serializes safe mutations behind an in-flight save', async () => {
    const dirty = new DirtyObject({ value: 0 });

    dirty.get().value = 1;

    const persistEntered = deferred();
    const finishPersist = deferred();

    const save = dirty.save(async () => {
        persistEntered.resolve();
        await finishPersist.promise;
    });

    await persistEntered.promise;

    let safeMutationStarted = false;

    const mutation = dirty.safeDirty((proxy) => {
        safeMutationStarted = true;
        proxy.value = 2;
    });

    assert.equal(safeMutationStarted, false);

    finishPersist.resolve();

    await Promise.all([save, mutation]);

    assert.equal(safeMutationStarted, true);
    assert.deepEqual(dirty.getSavedSnapshot(), { value: 1 });
    assert.equal((await dirty.getSnapshot()).value, 2);
    assert.equal(dirty.isDirty, true);
});

void test('DirtyObject save retains the exact persisted snapshot', async () => {
    const dirty = new DirtyObject({ value: 1 });

    dirty.get().value = 2;

    let persisted;

    await dirty.save(async (snapshot) => {
        persisted = snapshot;
    });

    assert.deepEqual(persisted, { value: 2 });
    assert.deepEqual(dirty.getSavedSnapshot(), persisted);
    assert.equal(dirty.isDirty, false);
});

// ============================================================
// KNOWN LIMITATIONS / FUTURE TESTS
// ============================================================

void test.todo(
    'deepEqual should define equality semantics for Date, Map, Set, and typed arrays',
);

void test.todo(
    'deepEqual should support circular object graphs if cycle support is introduced',
);

void test.todo(
    'deepFreeze should provide immutable semantics for Map, Set, and typed-array contents if supported',
);
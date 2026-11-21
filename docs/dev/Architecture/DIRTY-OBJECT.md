<!-- markdownlint-disable MD010 -->

# DirtyObject

`DirtyObject` is a shared utility for managing mutable application data and tracking changes before persistence.

Implementation: [`src/utils/dirtyObj.ts`](../../../src/utils/dirtyObj.ts)

It is independent of Settings, MarkDB, and Obsidian storage. Applications own their validation and persistence logic.

## Responsibilities

- Clone initial data into an independent working object.
- Track mutations recursively through nested plain objects and arrays.
- Maintain a shared modification version and dirty state.
- Report mutation details through an optional change callback.
- Provide immutable snapshots.
- Synchronize protected asynchronous operations using a shared mutex.

## Public API

| API                   | Description                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| `get()`               | Returns the mutable root proxy.                                            |
| `isDirty`             | Checks whether unsaved changes exist.                                      |
| `version`             | Returns the current mutation version.                                      |
| `getSnapshot()`       | Returns an immutable snapshot of current data.                             |
| `getSavedSnapshot()`  | Returns the last saved or marked-clean snapshot.                           |
| `markClean()`         | Marks the current state as clean without saving.                           |
| `holly()`             | A playful alias for `markClean()`. Sometimes data needs a little blessing. |
| `save(persist)`       | Persists a snapshot and marks the object clean after success.              |
| `safeDirty(callback)` | Executes an operation while holding the shared mutex.                      |

The standalone `safeDirty(proxy, callback)` helper is also available when only the root proxy is accessible.

## Change Notifications

`DirtyObject` accepts an optional `onChange` callback through its constructor.

The callback is invoked after a successful mutation and receives a `DirtyChange` object containing:

| Property    | Description                                           |
| ----------- | ----------------------------------------------------- |
| `target`    | The actual object containing the modified property.   |
| `property`  | The property key affected by the mutation.            |
| `operation` | The mutation operation: `set`, `delete`, or `define`. |

Example:

```ts
const hobbies = new DirtyObject({ user: { name: 'Akki' } }, (change) => {
	console.log(change.target);
	console.log(change.property);
	console.log(change.operation);
});

const data = hobbies.get();

data.user.name = 'Raj';

// target: { name: 'Raj' }
// property: 'name'
// operation: 'set'
```

Change notifications only report mutation details. They do not perform validation, persistence, or notification propagation. Consumers are responsible for interpreting and handling these changes according to their own requirements.

## Usage

```ts
type HobbyState = {
	items: Array<{ name: string }>;
};

const hobbies = new DirtyObject<HobbyState>({
	items: [],
});

const data = hobbies.get();

data.items.push({ name: 'Drawing' });

if (hobbies.isDirty) {
	await hobbies.save(async (snapshot) => {
		await saveHobbies(snapshot);
	});
}
```

For asynchronous operations that access or modify shared data across `await` boundaries, use `safeDirty()`:

```ts
await hobbies.safeDirty(async (data) => {
	data.items.push({ name: 'Archery' });
	await someAsyncOperation();
});
```

## Important Notes

- Nested proxies share the same underlying data and tracking state, but their identities are not cached.
- Dirty tracking records mutations, not differences from the original value. Reverting a change does not automatically clear dirty state.
- Recursive tracking supports plain objects and standard arrays, not arbitrary class instances or built-in objects.
- The `onChange` callback receives the actual underlying target object, not a proxy or immutable snapshot. Avoid modifying it directly.
- The mutex only protects operations that use it. Direct proxy mutations are not automatically synchronized.
- Avoid nested `safeDirty()` calls on the same instance because the mutex is not reentrant.
- Snapshots use `structuredClone()` and recursive freezing. Functions and unsupported values cannot be cloned; freezing `Map` and `Set` does not make their contents immutable.

## Integration Status

`DirtyObject` is implemented as a reusable utility. Settings and MarkDB can adopt it independently while retaining their own validation, persistence, change notification, and error-handling responsibilities.

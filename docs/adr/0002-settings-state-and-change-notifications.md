# ADR 0002: Settings State and Change Notifications

> **Author** : [Akhand Raj](https://github.com/Akkiraj1234)  
> **Status** : Accepted  
> **Date:** 22 November 2026  
> **Decision:** Use one shared settings object with dirty tracking, debounced saving, and path-based change listeners.

## Overview

OnePlugin stores plugin-wide and application settings in one object. This ADR explains how settings are loaded, updated, saved, and shared with applications.

Applications receive the complete settings object through `SettingContext.getSetting()`. They can update their own settings and listen for changes using dot-separated paths.

`DirtyObject` tracks changes and handles save snapshots, while `settingEventTree` finds the listeners that need to be notified.

## Context

Each application has its own default settings, stored under its application ID. When the plugin loads, saved settings are merged with these defaults so that new default values are not lost when older settings are loaded.

Applications also need a way to react to setting changes. For example, a listener registered for `hobby-manager` should be notified when `hobby-manager.enabled` changes.

Saving after every change would create unnecessary writes. Saving only when the plugin closes could also cause data loss. We need a simple way to handle both.

## Decision

### 1. One shared settings object

`OnePluginSettingTab` loads the saved data, merges it with the defaults, and wraps it in `DirtyObject`.

Applications access the complete settings object:

```ts
const settings = context.setting.getSetting();
const hobbyManager = settings['hobby-manager'];
```

Each application should only read and update its own settings. Plugin-wide settings, such as `databasePath`, remain in the same object.

This keeps settings in one place without creating separate stores or wrappers for every application.

### 2. Change tracking and saving

`DirtyObject` uses a recursive Proxy to track changes to nested objects and arrays. It also records the changed property path and creates snapshots for saving.

Whenever a setting changes, a save is scheduled after 1.5 seconds. If another change happens before then, the timer resets.

This groups nearby changes into one save instead of writing to storage after every update.

During runtime shutdown, `flushSave()` cancels the pending timer and attempts to save the latest settings immediately.

If a save fails, the error is logged and the object remains dirty. There is no automatic retry loop. Another change or runtime shutdown can trigger another save attempt.

### 3. Path-based change notifications

`settingEventTree` uses a Trie to store listeners by path.

For example, registering `hobby-manager.enabled` creates this path:

```text
root
 └── hobby-manager
      └── enabled
```

When `hobby-manager.enabled` changes, listeners registered for both `hobby-manager` and `hobby-manager.enabled` are notified.

Each listener receives the current value at its own registered path.

`register(path, callback)` also returns an unsubscribe function, so applications can remove listeners when they no longer need them.

A listener error is logged without stopping the other listeners from running.

### 4. Application settings UI

Applications can request their own settings container using `createContainer(id)`.

The container is added to OnePlugin's settings tab. Applications do not have to create one if they don't need a settings UI.

The root settings currently include the database path control. Its Save button updates `databasePath`, and the normal dirty-tracking process handles persistence.

### 5. Usage rules and limitations

This system has a few rules that applications must follow:

1. Always update the object returned by `getSetting()`. Changes to copied objects are not tracked.
2. Keep settings mutations synchronous. Direct Proxy writes are not serialized with an ongoing save.
3. Avoid changing settings inside listener callbacks. This can trigger more notifications and create loops.
4. Listener paths use dots as separators, so setting keys that need listeners must not contain dots.
5. Each application is responsible for validating its own settings values.
6. Do not assume a delayed save has succeeded. Save failures are logged.

There is also a concurrency limitation. A direct mutation made while `DirtyObject.save()` is waiting for storage can race with the save snapshot.

Until the settings API provides a serialized mutation method, applications should not use settings as shared mutable state across `await` operations.

## Alternatives Considered

1. **Save only during shutdown:** Rejected because crashes or unexpected reloads could lose recent changes.
2. **Save after every mutation:** Rejected because frequent UI changes would create unnecessary writes.
3. **Use a flat listener map:** Rejected because parent-path notifications would require manual prefix matching.
4. **Give every application a separate settings store:** Rejected because it adds complexity when Obsidian already stores plugin data in one object.
5. **Make settings immutable:** Rejected because current applications need simple, direct updates.
6. **Add automatic retries:** Rejected because retry rules and failure handling have not been designed yet.

## Consequences

- Settings are stored and saved through one central system.
- Nearby changes are grouped into fewer storage writes.
- Applications can listen to both exact and parent setting paths.
- Applications must respect ownership of their settings.
- The current API is flexible but does not provide strong type safety.
- Dirty tracking helps with persistence, but does not make asynchronous mutations safe.
- Listener errors do not stop other listeners.
- Dot-separated paths limit which setting keys can be observed.

## Follow-up Decisions

No additional runtime decision is needed for now.

A new ADR should be written when a major decision is made about:

- MarkDB storage formats, migrations, or lifecycle.
- Widget communication and ownership.
- Automatic application registration.
- A typed, validated, or serialized settings API.

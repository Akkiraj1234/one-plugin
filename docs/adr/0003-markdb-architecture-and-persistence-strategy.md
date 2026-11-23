<!-- markdownlint-disable MD007 -->

# ADR 0003: MarkDB Architecture and Persistence Strategy

> **Author** : [Akhand Raj](https://github.com/Akkiraj1234)  
> **Status** : Proposed  
> **Date** : 23 November 2026  
> **Decision:** Introduce a centralized MarkDB manager with cached database instances, buffered writes, journal-based recovery, and chunk-based storage.

## Overview

This proposal establishes a new architecture for MarkDB and defines how database instances, caching, change tracking, and persistence should be managed across OnePlugin.

The main MarkDB instance will be initialized by `OnePluginRuntime` and will act as the central manager for all database operations. It will manage database instances, collect changes, decide when to save data, and coordinate the persistence process.

Database modifications will first be collected in a temporary buffer and then written to a persistent journal before being applied to the actual database. During startup, MarkDB will check for pending journal data and recover changes that were not successfully committed.

At the storage level, MarkDB will use a custom ChunkStream implementation to read and write data through multiple fixed-size files inside the Obsidian vault.

This proposal also defines three supported formats: JSON, Database, and File.

## Table of Contents

- [Context](#context)
- [Decision](#decision)
    - [Main MarkDB Instance](#main-markdb-instance)
    - [Database Instance Management](#database-instance-management)
    - [DirtyObject Integration](#dirtyobject-integration)
    - [Write Collection and Persistence](#write-collection-and-persistence)
    - [Startup Recovery](#startup-recovery)
    - [ChunkStream Storage](#chunkstream-storage)
    - [Database Formats](#database-formats)
- [Runtime Responsibilities](#runtime-responsibilities)
- [Alternatives Considered](#alternatives-considered)
- [Consequences](#consequences)
- [Example Structure](#example-structure)
- [Summary](#summary)

## Context

The current MarkDB implementation provides basic database formats and instance caching. However, each database instance manages its own cached data and saving process.

The proposed design moves these responsibilities into a single MarkDB manager.

This will allow OnePlugin applications to share database instances and use a common persistence system instead of managing database saving independently.

The storage system should also support recovery after unexpected shutdowns and provide a chunk-based storage layer for handling larger amounts of data.

## Decision

We will introduce a centralized MarkDB manager initialized inside `OnePluginRuntime`.

### Main MarkDB Instance

The main MarkDB instance will manage all database instances and their persistence.

Its responsibilities will include:

- Managing database instances.
- Managing cached data.
- Coordinating read and write operations.
- Tracking database modifications.
- Collecting pending writes.
- Deciding when data should be saved.
- Managing the journal and commit process.
- Recovering pending changes during startup.
- Managing the underlying storage system.

Applications will receive the shared MarkDB instance through `ApplicationContext`.

### Database Instance Management

MarkDB will expose two primary methods:

```ts
markdb.get(path);

markdb.create(path, options);
```

**`get(path)`**

- Retrieves an existing database instance.
- If the instance is already cached, it returns the same instance.
- If the database exists but is not loaded, MarkDB initializes it before returning it.
- It should not create a new database implicitly.

**`create(path, options)`**

- Creates a new database at the given path.
- Accepts `MarkDBOptions` to determine the database format and configuration.
- Initializes and returns the created database instance.
- Prevents duplicate instances for the same database path.

The exact behavior when a database already exists during a `create()` request remains to be defined.

### DirtyObject Integration

DirtyObject is already used by the OnePlugin settings system to track modifications to in-memory objects.

The proposed design is to investigate using DirtyObject with MarkDB database instances.

- Database data may be wrapped in DirtyObject.
- Modifications should be detected automatically.
- When data changes, DirtyObject should inform the main MarkDB instance.
- MarkDB should use this information to decide which databases need saving.

This allows applications to modify database data without manually informing MarkDB about every change.

The exact integration remains open for further design, especially for File-format databases.

### Write Collection and Persistence

MarkDB will use a buffered write mechanism instead of immediately writing every modification to the main database.

Changes will first be collected for a short period and then persisted through a journal.

The persistence process will have two stages:

1. Write pending changes to temporary persistent storage.
2. Apply those changes to the actual database storage.

**Write Collection:**

- Database modifications are collected by MarkDB.
- Changes may initially remain in an in-memory cache.
- After a short period, MarkDB writes the collected changes to a persistent journal.
- The journal may use YAML provided through Obsidian's available APIs or another suitable format.

The final journal format has not been decided.

**Journal Commit:**

After a suitable period, MarkDB will process pending journal entries.

The proposed process is:

1. Lock the necessary database resources to prevent conflicting operations.
2. Read pending journal entries.
3. Prepare the relevant database state.
4. Apply pending changes to the main database.
5. Persist the updated database.
6. Confirm that the write succeeded.
7. Remove or rotate the successfully committed journal entries.

The commit should be atomic where possible.

If the commit fails, the journal entries must remain available for recovery.

### Startup Recovery

Whenever MarkDB initializes, it should check whether pending journal data exists.

If a journal is found, MarkDB should read its entries and apply any changes that have not already been committed.

Recovery should happen before the affected databases become available for normal operations.

The proposed process:

```text
MarkDB Initialization
        |
        v
   Check Journal
        |
        v
   Journal Exists?
       /       \
     Yes        No
      |          |
      v          |
 Read Entries    |
      |          |
      v          |
 Recover Data    |
      |          |
      +-----+----+
            |
            v
  Complete Initialization
```

The recovery mechanism must prevent already-committed changes from being applied twice.

Transaction IDs, sequence numbers, or another suitable mechanism should be investigated for this purpose.

Journal entries should only be removed after successful commit confirmation.

### ChunkStream Storage

At the lowest storage level, MarkDB will use a custom ChunkStream implementation.

Instead of storing all database data in a single large file, the storage system will use multiple fixed-size files inside a directory.

For example:

```text
database/
    chunks/
        000001
        000002
        000003
        000004
```

Each chunk will have a fixed maximum capacity.

Two initial chunk sizes are being considered:

- 8 KB
- 16 KB

The final size will be selected after considering performance and storage overhead.

**ChunkStream Responsibilities:**

- Reading data from chunks.
- Writing data to chunks.
- Handling reads and writes across chunk boundaries.
- Appending new data.
- Managing chunk allocation.
- Moving to the next chunk when the current chunk is full.
- Managing logical offsets and data lengths.

The purpose is to provide a common read/write interface so higher-level database implementations do not need to manage individual chunk files.

The exact ChunkStream API and chunk metadata structure remain to be designed.

### Database Formats

MarkDB will support three database formats.

**JSON Database:**

- Stores structured JSON data.
- Provides operations for reading and modifying JSON values.
- Uses MarkDB's persistence system to manage changes.

**Database Format:**

- Stores structured records and collections.
- Supports schema-based validation.
- Provides database-specific operations.

**File Format:**

- Provides direct read and write access to file contents.
- Does not require content to be interpreted as structured records.
- Uses the underlying MarkDB storage system where appropriate.

## Runtime Responsibilities

The main MarkDB instance will be owned by `OnePluginRuntime`.

**Startup:**

1. Initialize the settings system.
2. Create the main MarkDB instance.
3. Initialize its storage infrastructure.
4. Check for pending journal entries.
5. Recover pending changes when necessary.
6. Provide MarkDB to applications through `ApplicationContext`.

**Runtime:**

1. Applications request database instances through `get()` or `create()`.
2. MarkDB returns existing instances or initializes new ones.
3. Changes are tracked.
4. Pending changes are collected and written to the journal.
5. MarkDB commits journal entries to the main database.

**Shutdown:**

1. Applications are destroyed.
2. MarkDB processes pending writes.
3. Remaining changes are persisted where possible.
4. Database instances and storage resources are closed.

The exact shutdown behavior when persistence fails remains to be defined.

## Alternatives Considered

1. **Direct writes to the main database:** Every modification would immediately update the main database file. Rejected as the proposed design aims to collect changes and reduce unnecessary main database writes.

2. **Independent persistence for every database instance:** Each instance would manage its own caching and saving process. Rejected because persistence should be centrally managed by MarkDB.

3. **Single large storage file:** All database data would be stored in one file. The proposed design instead investigates chunk-based storage to manage data through smaller files.

4. **No persistent journal:** Pending changes would remain only in memory until the main database is updated. Rejected because pending modifications should be recoverable after unexpected shutdowns.

## Consequences

- MarkDB becomes responsible for centralized database and persistence management.
- Multiple applications can reuse the same database instance.
- DirtyObject may provide automatic change tracking.
- Changes can be collected before being committed to the main database.
- Journal data provides a recovery mechanism for pending writes.
- ChunkStream separates logical database operations from physical storage.
- JSON, Database, and File formats can share the same underlying storage infrastructure.
- Persistence and recovery become more complex.
- Additional storage space is required for journals and chunk metadata.
- Locking and commit operations must be designed carefully to prevent data loss or duplication.

## Example Structure

```text
src/
├── main.ts
├── registry.ts
└── core/
    ├── runtime.ts
    └── markdb/
        ├── index.ts
        ├── manager.ts
        ├── dirty.ts
        ├── journal/
        ├── chunkstream/
        ├── storage/
        └── formats/
            ├── json/
            ├── database/
            └── file/
```

This structure is illustrative. Actual file and directory names will be decided during implementation.

## Summary

- Main MarkDB instance → Centralized database and persistence manager.
- `get(path)` → Retrieves an existing database instance.
- `create(path, options)` → Creates and returns a database instance.
- DirtyObject → Proposed change-tracking mechanism.
- Journal → Temporarily stores pending changes.
- Recovery → Restores changes that were not successfully committed.
- ChunkStream → Handles chunk-based reading and writing.
- JSON DB → Structured JSON storage.
- Database → Structured records and collections.
- File DB → Direct file-content access.

Status: Proposed — Not Accepted

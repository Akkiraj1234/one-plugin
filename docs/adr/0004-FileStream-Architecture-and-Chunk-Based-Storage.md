<!-- markdownlint-disable MD007 MD013 -->

# ADR 0004: FileStream Architecture and Chunk-Based Storage

> **Author**: [Akhand Raj](https://github.com/Akkiraj123)
> **Status**: Proposed
> **Date**: 25 November 2026

## Table of Contents

- [Context](#context)
- [Decision](#decision)
    - [1. Storage Format](#1-storage-format)
    - [2. UTF-8 Encoding and Byte Measurement](#2-utf-8-encoding-and-byte-measurement)
    - [3. Chunk Size](#3-chunk-size)
    - [4. Logical Stream Architecture](#4-logical-stream-architecture)
    - [5. Chunk Index](#5-chunk-index)
    - [6. ReadStream](#6-readstream)
    - [7. WriteStream](#7-writestream)
    - [8. Chunk Management](#8-chunk-management)
    - [9. Write Finalization and Consistency](#9-write-finalization-and-consistency)
    - [10. Error Handling](#10-error-handling)
- [Storage Structure](#storage-structure)
- [Consequences](#consequences)

## Context

MarkDB uses a chunk-based storage system to store database data inside an Obsidian vault.

Instead of storing an entire database in one large file, the data is divided into multiple smaller files. This makes it possible to read and write portions of a database without loading the entire database into memory.

However, working directly with individual chunk files introduces several problems:

- Applications would need to know which physical file contains the required data.
- Reading data across multiple chunks would require managing file boundaries.
- Writing data would require handling chunk allocation, splitting and indexing.
- Maintaining the logical order of chunks would become difficult as the database grows.
- Applications would need to understand the physical storage structure.

Managing these operations individually would make MarkDB more complicated and tightly couple the database API to its physical storage implementation.

MarkDB therefore needs a stream abstraction that treats multiple physical chunk files as a single continuous text stream.

Applications should be able to read and write database data without knowing how many chunks exist or where individual pieces of data are physically stored.

## Decision

We will implement a FileStream system consisting of two main components:

- **ReadStream**: Reads data from multiple chunk files as one continuous stream.
- **WriteStream**: Writes data into multiple chunk files while maintaining their logical order and index.

Both components will operate on UTF-8 text. Physical chunk management, indexing and file operations will remain internal to FileStream.

### 1. Storage Format

MarkDB will use Markdown files (`.md`) as its physical storage format.

Database content will be stored inside a custom `mkdb` code block.

Example:

    ```mkdb
    {
      "version": 1,
      "data": "example"
    }
    ```

> #### Reason
>
> The reason we have choosen markdown wrapper with markdb code block is that according to [bsidian](https://obsidian.md/help/sync/settings) which means we cant use . dot folder and we cant use custom extension and 
> we has 2 options in that case either client turn on sync all setting and either we use .md 
> and we have choosen .md file becuse turning all sync all would be bad for the user experince
> since i dont mind pdf json to be synced acorss my device and we are .md file so it can be synced
> 2. why code block
> the reason behind code block is that obsdian try to index each file and its content for links and all
> but a database file does not contain any so we uses codeblock so obsdian by mistake does not makke any Conectiones out of it

this insure that The Markdown wrapper allows MarkDB files to be synchronized by Obsidian Sync using its default Markdown file support. FileStream will be responsible for reading and writing the content inside this storage format.

The stream interface will expose plain text rather than Markdown-specific content. The Markdown wrapper will be handled internally when reading and writing physical chunk files.

### 2. UTF-8 Encoding and Byte Measurement

All stream content will be stored as UTF-8 encoded text.

The public stream API will accept and return JavaScript strings rather than raw byte arrays.

However, chunk allocation and size measurement will always use the actual UTF-8 encoded byte length.

This distinction is important because JavaScript string length does not represent the actual UTF-8 storage size.

For example:

- ASCII characters generally require 1 byte.
- Many non-ASCII characters require multiple bytes.
- Some Unicode characters, including emoji, require 4 bytes.

FileStream must calculate the encoded byte length before allocating or writing data to a chunk.

**Chunk boundaries must never split a UTF-8 character.**

The implementation must also remain compatible with supported Obsidian environments. If `TextEncoder` is unavailable, an alternative UTF-8 byte-length implementation will be provided.

### 3. Chunk Size

The default maximum physical chunk size will be **64 KiB (65,536 bytes)**.

Each physical chunk will have its own Markdown wrapper, so the available space for database content will be smaller than 64 KiB.

The implementation must account for:

- The opening `mkdb` code block.
- The closing code block.
- Newline characters.
- The actual UTF-8 encoded payload size.

The complete physical file must not exceed the configured chunk size.

The initial implementation will use a fixed 64 KiB chunk size. Configurable chunk sizes may be considered separately in the future.

### 4. Logical Stream Architecture

FileStream will provide a logical view of multiple physical chunk files.

For example, a database might contain the following physical files:

    MarkDB/
    └── Hobbies/
        ├── index.md
        └── chunks/
            ├── 001.md
            ├── 002.md
            ├── 003.md
            └── 004.md

Although the data is stored in separate files, ReadStream and WriteStream will treat it as one continuous stream.

The logical stream will maintain an ordered mapping between:

- Logical stream positions.
- Physical chunk identities.
- Local byte offsets inside each chunk.
- Available payload lengths.

The stream must not depend on physical filenames to determine logical order.

Chunk identities will remain stable when possible. Logical ordering will be managed by the index rather than by linking one physical chunk directly to another.

Applications will interact with the stream through its API instead of accessing chunk files directly.

### 5. Chunk Index

FileStream will maintain an index describing the logical arrangement of physical chunks.

The index will contain enough information to locate data without reading every chunk file.

At a minimum, each chunk entry will contain:

| Field    | Description                      |
| -------- | -------------------------------- |
| `id`     | Unique physical chunk identifier |
| `offset` | Starting logical byte position   |
| `size`   | Payload size in UTF-8 bytes      |
| `path`   | Physical file location           |

Example logical index:

    {
      "version": 1,
      "totalSize": 150000,
      "chunks": [
        {
          "id": "001",
          "offset": 0,
          "size": 60000,
          "path": "chunks/001.md"
        },
        {
          "id": "002",
          "offset": 60000,
          "size": 60000,
          "path": "chunks/002.md"
        },
        {
          "id": "003",
          "offset": 120000,
          "size": 30000,
          "path": "chunks/003.md"
        }
      ]
    }

The index will be stored separately from the chunk content.

ReadStream will use this index to locate the physical chunk containing a requested logical position.

For example, reading from logical offset `65000` should locate the second chunk directly instead of opening the first chunk and reading through it.

The index will be loaded once when opening the stream and maintained in memory during stream operations.

### 6. ReadStream

ReadStream will expose multiple physical chunks as one continuous readable text stream.

It will be responsible for:

- Loading the logical index.
- Locating the appropriate chunk for a requested position.
- Reading only the required physical chunks.
- Removing the Markdown wrapper before returning content.
- Combining data across chunk boundaries when necessary.
- Maintaining correct UTF-8 character boundaries.

A read operation should not require loading the entire database into memory.

For example, if a database contains 100 chunks and an application requests data located in the 50th chunk, ReadStream should be able to locate and read that chunk directly using the index.

The logical stream should provide a sequential reading interface as well as support for reading a specific logical byte range.

The exact public API will be defined during implementation.

### 7. WriteStream

WriteStream will provide a single logical interface for writing data across multiple physical chunk files.

Applications should not need to manage individual chunk creation, file splitting or index updates.

WriteStream will be responsible for:

- Accepting plain UTF-8 text.
- Calculating the actual encoded byte length.
- Dividing the content into valid chunk boundaries.
- Creating physical Markdown chunk files.
- Maintaining logical chunk ordering.
- Generating the updated index.
- Finalizing the written stream.

When a chunk reaches its available payload capacity, WriteStream will continue writing into another chunk.

Chunk splitting must never break a UTF-8 character.

WriteStream should also avoid requiring the entire database to remain in memory while writing. It should use a bounded internal buffer and write completed chunks to the vault.

The stream API should hide physical chunk allocation from applications.

### 8. Chunk Management

Physical chunk management will remain internal to FileStream.

Applications must not need to:

- Determine which chunk contains a particular position.
- Create physical chunk files manually.
- Maintain chunk ordering.
- Calculate logical offsets.
- Split content between files.
- Update the chunk index manually.

FileStream will handle these responsibilities.

Each chunk will be identified independently of its logical position. This allows the logical order to change without relying on linked-list-style references between physical files.

Unchanged chunks may be reused during updates where possible.

The index will remain the source of truth for the current logical stream layout.

### 9. Write Finalization and Consistency

Writing multiple physical files introduces a consistency problem.

If a write operation fails halfway through, the database must not start using an incomplete set of chunks.

FileStream will therefore use a staged write process.

The process will follow these general steps:

1. Begin a new write operation.
2. Generate the updated chunk files.
3. Generate the updated logical index.
4. Complete all required physical writes.
5. Publish the new index only after the required chunks have been written successfully.
6. Clean up obsolete chunks after the new layout has been committed.

The previous index must remain valid until the new index is successfully published.

A failed write must not cause the current logical stream to reference incomplete or missing chunks.

Where possible, unchanged chunks will be reused rather than rewritten.

The implementation must account for the fact that Obsidian Vault operations do not provide a multi-file transaction. The publication mechanism must therefore be designed around individual file operations and their actual guarantees.

Detailed crash recovery, journal handling and database-level transaction semantics will be documented separately.

### 10. Error Handling

FileStream must detect and report errors involving:

- Missing chunk files.
- Invalid or corrupted chunk content.
- Invalid chunk indexes.
- UTF-8 encoding errors.
- Unexpected chunk sizes.
- Failed file reads or writes.
- Failed index updates.
- Incomplete write operations.

Errors must be propagated to the caller rather than silently ignored.

The higher-level MarkDB manager will be responsible for coordinating error handling with the OnePlugin runtime.

## Storage Structure

The expected storage structure will look similar to this:

    MarkDB/
    └── Hobbies/
        ├── index.md
        └── chunks/
            ├── 001.md
            ├── 002.md
            ├── 003.md
            └── ...

The index will describe the logical stream layout, while the chunk files will contain the actual database text.

The physical structure is an internal implementation detail. Applications will interact with the logical stream rather than individual files.

## Consequences

### Benefits

- Multiple physical files can be accessed as one logical stream.
- Applications do not need to manage individual chunk files.
- Random reads can locate the required chunk through the index.
- Only the required chunks need to be read for a requested range.
- UTF-8 byte measurement keeps physical chunk sizes controlled.
- Markdown storage works with Obsidian Sync's default Markdown support.
- The chunk size provides a predictable upper bound for physical files.
- Physical chunk ordering is independent of filenames.
- The architecture allows unchanged chunks to be reused during updates.

### Limitations and Trade-offs

- Maintaining an index introduces additional storage and synchronization work.
- Updating logical stream positions may require rebuilding parts of the index.
- UTF-8 byte measurement adds processing overhead.
- Markdown wrappers reduce the available payload capacity of each chunk.
- Multiple physical file operations cannot be treated as one atomic transaction.
- Failed writes may leave unused or incomplete physical files that require cleanup.
- Obsidian Sync conflicts may still occur when multiple devices modify the same database.
- The initial implementation will use a fixed 64 KiB physical chunk size.

### Future Considerations

The following areas will be considered separately:

- Journal and recovery architecture.
- Database-level transaction handling.
- Concurrent read and write coordination.
- Chunk size benchmarking.
- Index optimization for large databases.
- Configurable storage locations.
- Configurable chunk sizes.
- Advanced chunk reuse and compaction strategies.

# Application Architecture

This guide records application-level rules that are shared across OnePlugin applications. Application-specific views, data models, and commands remain owned by their applications.

## Mutable application state

Applications that need mutable state with save tracking should use [Dirty Object Architecture](DIRTY-OBJECT.md). `DirtyObject` tracks nested mutations and coordinates snapshots and persistence, while the application remains responsible for validating and saving its own data.

Applications must not use a `DirtyObject` instance to share private state with another application.

## Styling

Follow [ADR 0001: Application Styling and CSS Build Strategy](../../adr/0001-application-styling-and-css-build.md) when adding application styles.

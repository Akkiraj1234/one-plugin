# OnePlugin Architecture

OnePlugin is a plugin made for Obsidian. It is not an application itself, but a collection of smaller applications and features that run inside OnePlugin.

OnePlugin provides a shared environment where applications can work together through widgets and a defined communication system. All applications use the Obsidian runtime and follow its lifecycle.

> **Important!**
>
> Never create a separate blocking runtime inside Obsidian. Applications should use the Obsidian runtime. They can also use asynchronous tasks for background work, but these must not block the main runtime.

## Architecture

OnePlugin has four main architectural areas:

1. **Plugin-level architecture:** How applications are registered, initialized, started, and stopped.
2. **Application-level architecture:** How individual applications are created and managed inside OnePlugin.
3. **MarkDB architecture:** How data is stored, managed, and accessed by applications.
4. **Widget-level architecture (planned):** How widgets allow different applications to communicate and share functionality.

## Basic Architecture

OnePlugin uses a central runtime to manage its applications.

Applications are registered at compile time through the application registry. Each application provides its own definition and a method to create an instance.

When an application is created, it receives access to shared services such as settings and the application registry. This gives applications access to the resources they need without creating separate instances.

### Application Communication

Applications do not communicate directly with each other. Instead, they use widgets and a shared communication format.

Each application can expose widgets to share its data or functionality. Other applications can use these widgets without knowing how they work internally.

This keeps applications independent and makes it easier to connect new applications to OnePlugin.

### Application Lifecycle

The central runtime manages the lifecycle of each application.

Applications go through the following stages:

- **Initialize:** Set up the application and receive its context.
- **Prepare:** Prepare the resources needed by the application.
- **Start:** Start the application's functionality.
- **Stop:** Stop running processes.
- **Dispose:** Release resources when they are no longer needed.

### Obsidian Integration

Applications use the Obsidian API to create and manage views, side panels, and other UI components.

Obsidian manages these components through its own registration system and lifecycle. Applications handle their own rendering, data initialization, and internal logic.

**Resource management:** Avoid clearing caches unnecessarily when changing views or pages. Some resources may still be needed when the user returns to a previous view.

The widget communication system is planned for future development.

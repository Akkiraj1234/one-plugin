# OnePlugin Architecture

OnePlugin is a plugin made for Obsidian. It is not an application itself, but a collection of smaller applications and features that run inside OnePlugin.

OnePlugin provides a shared runtime for smaller applications inside Obsidian. Applications use the Obsidian runtime and follow the OnePlugin lifecycle.

> **Important!**
>
> Never create a separate blocking runtime inside Obsidian. Applications should use the Obsidian runtime. They can also use asynchronous tasks for background work, but these must not block the main runtime.

## Architecture

OnePlugin has four main architectural areas:

1. **[Plugin-level architecture](./docs/dev/Architecture/PLUGIN.md)** — How applications are registered, initialized, started, and stopped.
2. **[Application-level architecture](./docs/dev/Architecture/APPLICATION.md)** — How individual applications are created and managed inside OnePlugin.
3. **[MarkDB architecture](./docs/dev/Architecture/MARKDB.md)** — How data is stored, managed, and accessed by applications.
4. **[Widget-level architecture (planned)](./docs/dev/Architecture/WIDGETS.md)** — How widgets will allow different applications to communicate and share functionality.

## Basic Architecture

OnePlugin uses a central runtime to manage its applications.

Applications are registered at compile time through the application registry. Each application provides its own definition and a method to create an instance.

When an application is created, it receives an application context containing access to shared resources and services. This allows applications to use the resources they need without creating separate instances.

### Application Communication

Applications do not communicate directly. The plugin currently has no cross-application communication API.

Widget communication is planned future work. The plugin keeps placeholder widget definitions, but they do not provide a communication API or runtime behaviour yet.

### Application Lifecycle

The central runtime manages the lifecycle of each application.

Applications go through the following stages:

- **Initialize:** Set up the application and receive its context.
- **Start:** Start the application's functionality.
- **Destroy:** Stop running work and release resources, including after a partial startup.

### Obsidian Integration

Applications use the Obsidian API to create and manage views, side panels, and other UI components.

Obsidian manages these components through its own registration system and lifecycle. Applications handle their own rendering, data initialization, and internal logic.

**Resource management:** Avoid clearing caches unnecessarily when changing views or pages. Some resources may still be needed when the user returns to a previous view.

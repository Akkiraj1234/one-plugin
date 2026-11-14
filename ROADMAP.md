<!-- markdownlint-disable MD007 -->

# One-Plugin Roadmap

**One-Plugin — A plugin to make life easier.**

This document outlines the planned development and release milestones for One-Plugin.

## Future Improvements

## Release Roadmap

### 1.0.0 — Foundation

**Current focus: Complete the plugin runtime foundation.**

- [ ] Complete the core plugin architecture and application lifecycle implementation.
    - [ ] Finalize the shared settings interface provided through `ApplicationContext`.
    - [ ] Connect application settings access to the runtime and remove unused settings-manager code.
    - [ ] Implement startup failure handling for application initialization, preparation, and startup.
    - [ ] Ensure partially initialized applications and previously started applications are cleaned up safely.
    - [ ] Ensure `dispose()` is attempted even when an application's `stop()` fails.
    - [ ] Continue shutting down other applications when one application fails.
- [ ] Add runtime lifecycle tests.
    - [ ] Test application startup order.
    - [ ] Test reverse-order shutdown.
    - [ ] Test application settings access.
    - [ ] Test startup failure and cleanup behavior.
    - [ ] Test shutdown when `stop()` or `dispose()` fails.
- [ ] Verify the plugin runtime against the [Plugin Runtime Architecture](docs/dev/Architecture/PLUGIN.md) guide.
- [ ] Establish the core plugin architecture and application lifecycle.
- [ ] Set up the main settings screen and global plugin settings.
- [ ] Create `registerapp.mjs` to discover registered applications and generate `src/registry.ts`.
- [ ] Set up MarkDB inside `src/core/markdb/`.
    - [ ] Move the existing implementation from `oldsrc/core/markdb/` into the new source structure.
    - [ ] Ensure the existing MarkDB tests pass against the migrated implementation.
    - [ ] Create the default database when the plugin starts for the first time.
    - [ ] Define the initial database structure and schemas.
    - [ ] Implement basic data operations (create, read, update, and delete).
    - [ ] Add data validation and error handling.
    - [ ] Ensure database changes are safely saved and persist after restarting Obsidian.
- [ ] Create and maintain documentation for the core architecture, database, settings, and development process.
- [ ] Improve and add test cases for new and modified functionality.
- [ ] Ensure existing tests continue to pass after changes.

**Recommended order:** Finish the runtime foundation and its tests first. Then migrate and integrate MarkDB.

### 1.1.0 — Hobby Manager

- [ ] Introduce the Hobby Manager.
- [ ] Implement basic hobby creation, viewing, editing, and deletion.
- [ ] Support parent and child hobbies.
- [ ] Integrate Hobby Manager with MarkDB.
- [ ] Add documentation for the new feature.
- [ ] Add and update test cases for the changes.

### 1.2.0 — Hobby Planner

- [ ] First release of Hobby Planner.
- [ ] Plan and organise hobbies through a timeline.

### 1.3.0 — Hobby Ticker

- [ ] First release of Hobby Ticker.
- [ ] Track hobby activities and time spent.
- [ ] Support activity colours and progress tracking.

### 1.4.0 — New Tab Page

- [ ] Introduce a new tab page.
- [ ] Provide a central place to access One-Plugin features.

### 1.5.0 — Hobby Previewer

- [ ] First release of Hobby Previewer.
- [ ] Provide a preview of hobby information and activity.

### 1.6.0 — Data Integration Layer

- [ ] Introduce a data integration layer.
- [ ] Allow users to define rules for fetching external data.
- [ ] Integrate fetched data with Hobby Planner.

---

_This roadmap is subject to change as development progresses. Features and release milestones may be adjusted based on technical requirements and user feedback._

For instructions on organizing roadmap tasks and transferring completed items to the changelog, see the [Roadmap Guide](docs/dev/ROADMAP.md). The [Package Scripts](docs/dev/SCRIPTS.md) guide documents the `node update-changlog.mjs` helper and its effects.

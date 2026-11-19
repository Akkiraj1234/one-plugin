<!-- markdownlint-disable MD007 -->

# One-Plugin Roadmap

**One-Plugin — A plugin to make life easier.**

This document outlines the planned development and release milestones for One-Plugin.

## Future Improvements

- [ ] implemenent the `getSettingDefinitions` for [duel support](<https://docs.obsidian.md/Plugins/User+interface/Settings#Legacy+imperative+display()+approach>)
- [x] fix Css global build and shadow build according to the ADR-0001.

## Release Roadmap

### 1.0.0 — Foundation

**Goal: Make the plugin start and stop its apps reliably, give apps the settings they need, and save data safely.**

- [x] Finish the app lifecycle: load apps independently and destroy every running app during plugin shutdown.
- [x] Give each app access to its own settings through the shared app context, and connect that access to the plugin's settings screen and saved settings.
- [ ] Finish application settings updates and change notifications, including the placeholder `register()` API.
- [x] Create a shared dirty-state tracker for settings and MarkDB that records changed values and retains a dirty reference until those changes are saved.
- [x] Handle an app failing while it starts: report the problem, clean up that app, and continue loading the other apps.
- [x] Handle shutdown failures: continue destroying the other apps when one app fails to destroy.
- [x] Add runtime tests for independent app loading, shutdown, settings access, and startup or shutdown failures.
- [x] Check that the runtime matches the [Plugin Runtime Architecture](docs/dev/Architecture/PLUGIN.md) guide.
- [ ] Finish the main settings screen and plugin-wide settings.
- [ ] Finish connecting MarkDB in `src/core/markdb/` to plugin use:
    - [ ] Create the default database the first time the plugin starts.
    - [ ] Define the database's starting structure and data rules (schemas).
    - [ ] Support creating, reading, updating, and deleting data.
    - [ ] Check data is valid and give clear errors when something goes wrong.
    - [ ] Save changes so they are still there after Obsidian restarts.
    - [ ] Keep the MarkDB tests passing.
- [ ] Keep the developer guides up to date for the runtime, settings, MarkDB, and development process.
- [ ] Add tests for changed behavior and make sure existing tests still pass.

**Recommended order:** Finish and test the app lifecycle and settings first. Then connect MarkDB and verify its tests.

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

For instructions on organizing roadmap tasks and transferring completed items to the changelog, see the [Roadmap Guide](docs/dev/ROADMAP.md). The [Package Scripts](docs/dev/SCRIPTS.md) guide documents the `node scripts/update-changlog.mjs` helper and its effects.

# One-Plugin Roadmap

**One-Plugin — A plugin to make life easier.**

This document outlines the planned development and release milestones for One-Plugin.

## Future Improvements

### Development Tooling

- [x] Restructure the development and deployment scripts; rename `build-test.mjs` to `deploy-test.mjs`.
- [x] Add ESLint configuration and improve linting scope.
- [x] Fix TypeScript configuration issues and warnings.
- [x] Update esbuild configuration and package scripts.
- [x] Improve local test-vault configuration and deployment workflow.

### Testing

- [x] Move MarkDB tests into a dedicated `tests/markdb/` directory.
- [x] Add automated tests for the deployment script.
- [x] Add tests for changelog generation.
- [x] Improve existing tooling and test coverage.

### MarkDB and Hobby Manager

- [x] Reorganise MarkDB test structure.
- [x] Update Hobby Manager UI and styling.
- [x] Improve Hobby Planner and Hobby Manager playground components.

### Versioning and Release Tooling

- [x] Improve version synchronization between `package.json`, `manifest.json`, and `versions.json`.
- [x] Update release automation and GitHub release workflow.
- [x] Add automatic changelog generation from completed roadmap tasks.

### Documentation

- [x] Update `AGENTS.md` for the project structure and development workflow.
- [x] Rewrite the root README and add a dynamic release version badge.
- [x] Add the project documentation index.
- [x] Add architecture and package script documentation.
- [x] Improve development setup and contribution guidelines.
- [x] Add roadmap authoring instructions.
- [x] Update user documentation and architecture decision indexes.
- [x] Remove the outdated `src/README.md`.
- [x] Review and correct documentation cross-references.

## Release Roadmap

### 1.0.0 — Foundation

- [ ] Establish the initial database structure.
- [ ] Implement the initial data management and editing functionality.

### 1.1.0 — Hobby Manager

- [ ] First release of Hobby Manager.
- [ ] Basic hobby management and CRUD operations.

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

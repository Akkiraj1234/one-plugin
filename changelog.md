## 0.1.5

### Development Tooling
- Restructure the development and deployment scripts; rename `build-test.mjs` to `deploy-test.mjs`.
- Add ESLint configuration and improve linting scope.
- Fix TypeScript configuration issues and warnings.
- Update esbuild configuration and package scripts.
- Improve local test-vault configuration and deployment workflow.

### Testing
- Move MarkDB tests into a dedicated `tests/markdb/` directory.
- Add automated tests for the deployment script.
- Add tests for changelog generation.
- Improve existing tooling and test coverage.

### MarkDB and Hobby Manager
- Reorganise MarkDB test structure.
- Update Hobby Manager UI and styling.
- Improve Hobby Planner and Hobby Manager playground components.

### Versioning and Release Tooling
- Improve version synchronization between `package.json`, `manifest.json`, and `versions.json`.
- Update release automation and GitHub release workflow.
- Add automatic changelog generation from completed roadmap tasks.

### Documentation
- Update `AGENTS.md` for the project structure and development workflow.
- Rewrite the root README and add a dynamic release version badge.
- Add the project documentation index.
- Add architecture and package script documentation.
- Improve development setup and contribution guidelines.
- Add roadmap authoring instructions.
- Update user documentation and architecture decision indexes.
- Remove the outdated `src/README.md`.
- Review and correct documentation cross-references.

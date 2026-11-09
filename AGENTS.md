# AGENTS.md

Instructions for AI agents working on OnePlugin.

## 1. Read Before Working

Before making changes, read:

- `CONTRIBUTING.md` — Contribution guidelines.
- `docs/dev/DEVELOPMENT.md` — Development setup and workflow.
- `ARCHITECTURE.md` — Project architecture.

Follow these documents when working on the project.

## 2. Project Overview

OnePlugin is an Obsidian community plugin.

- Target: Obsidian desktop and mobile.
- Platform: Obsidian Plugin API.
- Build: TypeScript/JavaScript bundled using esbuild.
- Output: `main.js`, `manifest.json` and optional `styles.css`.

Follow the existing implementation instead of assuming a standard Obsidian sample plugin structure.

## 3. Project Structure

| Directory      | Purpose                              |
| -------------- | ------------------------------------ |
| `src/core/`    | Core logic and shared functionality. |
| `src/widgets/` | Individual widgets.                  |
| `src/main.ts`  | Plugin entry point and lifecycle.    |
| `docs/`        | Project documentation.               |
| `tests/`       | Tests.                               |
| `build/`       | Generated build files.               |

Maintain the existing structure. Do not reorganize directories without a clear reason.

## 4. Before Making Changes

- Check whether a GitHub issue exists for the requested work.
- Do not start unapproved features or bug fixes.
- Understand the existing implementation before modifying it.
- Check how affected modules interact.
- Reuse existing functionality.
- Avoid unrelated changes.

Ask before making assumptions when requirements are unclear.

## 5. Coding Guidelines

OnePlugin prioritizes simple, readable and maintainable code.

- Document every class, function and method using JSDoc.
- Use meaningful names.
- Keep functions focused on one responsibility.
- Avoid unnecessary abstractions and dependencies.
- Avoid duplicate code.
- Handle errors and invalid inputs.
- Follow existing naming conventions.
- Keep module responsibilities separate.
- Prefer `async/await` and handle asynchronous errors.

### API Changes

Whenever an existing API changes:

- Update its documentation.
- Explain why the change was necessary.
- Mention the API change and version in the commit.
- Document breaking changes.

Do not silently change existing APIs.

## 6. Widget Guidelines

Every widget should follow this structure:

```text
WidgetName/
├── index.js
└── index.css
```

### CSS

- Import the stylesheet through `index.css`.
- Prefix CSS classes with the widget ID.
- Avoid generic class names.
- Prevent styles from affecting other widgets.

Example:

```css
.HManager-panel-container {
}
.HManager-panel-header {
}
```

### Shadow DOM

- Most root-level widgets do not use Shadow DOM.
- Use widget-specific CSS prefixes for these widgets.
- Independent widgets may use Shadow DOM when appropriate.

## 7. Obsidian Development Guidelines

Follow the official Obsidian API and plugin guidelines.

- Use `this.addCommand()` for user-facing commands.
- Keep command IDs stable after release.
- Use `this.loadData()` and `this.saveData()` for plugin settings and data where appropriate.
- Register event listeners using Obsidian's registration helpers.
- Clean up DOM events, intervals and other listeners when the plugin unloads.
- Avoid desktop-only APIs unless required.
- Consider mobile compatibility.
- Keep plugin startup lightweight.
- Defer expensive operations when possible.

References:

- [Obsidian API](https://docs.obsidian.md)
- [Developer Policies](https://docs.obsidian.md/Developer+policies)
- [Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)

## 8. Code Restrictions

- Do not use Node.js modules in application code.
- Do not introduce unnecessary external dependencies.
- Prefer browser-compatible packages.
- Bundle runtime dependencies into the plugin build.
- Do not modify generated files inside `build/`.
- Do not modify `.gitignore` or root configuration files unless required.
- Do not change build or release scripts without approval.

Node.js modules are allowed in development and build scripts.

## 9. Security and Privacy

Follow Obsidian's developer policies.

- Prefer local and offline operation.
- Make network requests only when required.
- Do not introduce hidden telemetry.
- Never execute remote code.
- Do not collect or transmit vault data without a clear need and user consent.
- Clearly document external services and data usage.
- Do not access files outside the vault unless explicitly required and permitted.

## 10. UI and Performance

### UI Guidelines

- Use clear and short UI text.
- Prefer sentence case.
- Keep buttons and labels consistent.
- Use clear action-oriented descriptions.
- Avoid unnecessary UI elements.

### Performance

- Keep plugin startup lightweight.
- Avoid unnecessary vault scans.
- Batch disk operations where possible.
- Debounce expensive operations when needed.
- Avoid unnecessarily large in-memory structures.

## 11. Manifest and Releases

When modifying `manifest.json`:

- Keep the plugin ID unchanged.
- Maintain valid version numbers using Semantic Versioning.
- Keep `minAppVersion` accurate.
- Ensure required manifest fields are present.

Do not run version or release commands unless explicitly requested.

Release requirements:

- Keep `manifest.json` and `versions.json` consistent.
- Use the manifest version as the Git tag.
- Include `main.js`, `manifest.json` and optional `styles.css` in releases.

## 12. Documentation

Update documentation whenever implementation changes require it.

- `docs/dev/` — Developer documentation.
- `docs/user/` — User documentation.
- `docs/adr/` — Architectural decisions.

Keep documentation consistent with the implementation. Do not document features that do not exist.

## 13. Testing

Before considering a change complete:

1. Run relevant tests using `npm test`.
2. Run `npm run lint`.
3. Build using `npm run build`.
4. Test UI changes using `npm run deploy-test`.

Always use a dedicated Obsidian test vault.

Do not claim tests passed unless they were actually executed.

Where possible, test on both desktop and mobile.

## 14. Git Guidelines

- Work on the appropriate issue branch.
- Do not commit directly to `main`.
- Do not modify unrelated files.
- Never commit `workflow.json`.
- Do not commit generated build files.
- Keep commit messages clear.
- Reference the related issue in commits and pull requests.

Do not run version or release commands unless explicitly requested.

## 15. Agent Rules

### Do

- Understand existing code before changing it.
- Follow the existing architecture.
- Reuse existing implementations.
- Keep changes focused.
- Update relevant documentation.
- Test changes before considering them complete.

### Don't

- Introduce unnecessary abstractions.
- Duplicate existing functionality.
- Remove existing features without approval.
- Change APIs without documentation.
- Modify unrelated configuration files.
- Make assumptions about undocumented behavior.
- Claim successful tests without running them.

**Keep OnePlugin simple, consistent and maintainable.**

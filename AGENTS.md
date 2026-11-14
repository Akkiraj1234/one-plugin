# AGENTS.md

Repository instructions for AI coding agents working on OnePlugin. These instructions are requirements, not suggestions. Follow them whenever you inspect, plan, edit, test, or document this repository.

The goal is to make correct, maintainable changes with the least unnecessary code. Be deliberate about understanding the whole change, but keep the implementation and diff focused.

## Start Here

Before making a change, read the relevant parts of:

- [Developer documentation index](docs/dev/README.md) to locate the right guide.
- [Contributing guide](CONTRIBUTING.md) for project contribution expectations.
- [Architecture overview](ARCHITECTURE.md) and the relevant guide under [docs/dev/Architecture](docs/dev/Architecture/).
- [Development guide](docs/dev/DEVELOPMENT.md) when setup, deployment, or Obsidian UI testing is involved.
- [Package script reference](docs/dev/SCRIPTS.md) before running project commands.
- Relevant [architecture decision records](docs/adr/README.md) before changing an area with recorded design decisions.

Then inspect the owning implementation, its callers, related types, and nearby tests. Follow the behavior far enough to understand where data enters, how it changes, and where its effects are observed. Do not rely on filenames or documentation alone.

When sources disagree, use this order:

1. The user's explicit task and constraints.
2. Current implementation and tests for behavior that already exists.
3. Accepted architecture decisions and architecture documentation for intended design.
4. Other developer documentation and examples.

Do not treat planned features as implemented. Do not copy conventions from a generic Obsidian sample plugin when OnePlugin has its own architecture.

## Working Method

### 1. Understand the complete change

Before editing:

- Restate the requested outcome in concrete terms.
- Inspect the working tree and relevant files. Preserve changes that were already present.
- Trace the affected path through callers, registration, types, state, persistence, events, tests, exports, build configuration, and documentation as applicable.
- Identify compatibility concerns, especially saved data, public APIs, command IDs, settings keys, and lifecycle behavior.
- Form a specific hypothesis about the cause or required change and identify the smallest check that could disprove it.

Do not expand the task into adjacent improvements. Mention worthwhile follow-up work separately instead of silently adding it.

### 2. Choose the smallest complete solution

Use the first option that fully solves the problem:

1. Remove unnecessary work or behavior when that is sufficient.
2. Reuse an existing helper, component, service, type, or pattern.
3. Use a platform or standard-library capability already available in the runtime.
4. Use an already-installed dependency when it is appropriate.
5. Add new code only when the existing options do not solve the problem.

Prefer deletion or a direct change over another abstraction. Do not add wrappers, layers, configuration, options, conversion steps, dependencies, or extension points for hypothetical future needs.

Keep the existing architecture and boundaries. Do not move code between layers or redesign interfaces just to make a local change look cleaner. A small diff is valuable only when it remains understandable and handles the required cases.

Be economical, not incomplete: include every caller, test, fixture, type, export, and document that the change actually requires.

### 3. Implement deliberately

- Make one focused change at a time.
- Keep functions and modules responsible for one clear job.
- Preserve existing validation and error handling when moving or simplifying code.
- Handle invalid input and asynchronous failures at the boundary that owns them.
- Prefer straightforward control flow and data structures over clever or compressed code.
- Add comments only to explain why something non-obvious is necessary; do not narrate what the code already says.
- Do not add speculative fallback behavior. Make limitations explicit when a deliberate shortcut is appropriate.
- Do not hide errors that could cause data loss, inconsistent state, or a partially initialized application.

For bugs, trace the full set of callers and reproduce or isolate the failure before editing. Fix the underlying cause in the correct shared location rather than patching individual symptoms.

### 4. Validate as you work

After the first implementation edit, run the narrowest useful test, type check, lint check, or build for that change. Do not wait until the end to discover that the approach is broken.

For non-trivial new logic—such as a parser, loop with meaningful edge cases, state transition, data transformation, or new script—add a focused test or a small assert-based self-check. Trivial changes do not need tests solely to increase test count.

Run broader checks when the change warrants them. If a check fails, determine whether the failure is caused by your change. Fix it when in scope and rerun the check. Do not change unrelated code just to silence an unrelated failure.

For documentation-only changes, verify relative Markdown links, referenced paths, npm script names, and factual claims against the current repository.

### 5. Finish and report accurately

Before finishing:

- Review the diff for unrelated changes, accidental formatting churn, generated files, and sensitive local data.
- Confirm that affected tests and documentation were updated.
- State which checks passed, failed, or were not run.
- Mention meaningful assumptions, shortcuts, limitations, and remaining risks.

Never claim that a command or test passed unless it was actually run and passed.

## Project Structure and Facts

OnePlugin is an Obsidian desktop and mobile plugin. Plugin runtime code is TypeScript bundled to browser-compatible JavaScript. Node.js belongs in development, test, build, and release tooling—not in plugin runtime modules.

Use the current project structure:

- `src/main.ts` — Obsidian plugin lifecycle entry point.
- `src/registry.ts` — statically registers application definitions.
- `src/core/registry.ts` — application registry implementation and duplicate-ID checks.
- `src/core/runtime.ts` — coordinates settings and application startup and shutdown.
- `src/core/platform/` — Obsidian platform integration, including the settings tab.
- `src/core/types/` — shared contracts, including application lifecycle types.
- `src/core/markdb/` — MarkDB implementation.
- `src/apps/` — application implementations and their metadata.
- `tests/markdb/` — MarkDB tests.
- `tests/scripts/` — development-tooling tests.
- `docs/dev/`, `docs/user/`, and `docs/adr/` — developer guides, user documentation, and architecture decision records.
- `esbuild.config.mjs` — build configuration; generated output is written under `build/<package-name>/`.

Do not create or assume a `src/widgets/` feature directory. Widget communication is a planned architectural area; check its current status before implementing anything that depends on it.

The registry currently registers Hobby Manager. Do not assume that an application is active merely because its source or metadata exists; follow the actual registration path.

For detailed ownership and runtime behavior, consult [ARCHITECTURE.md](ARCHITECTURE.md) and the relevant guide under [docs/dev/Architecture](docs/dev/Architecture/).

## Coding Style and Implementation Rules

These rules describe how to approach implementation. They do not require copying another repository's naming, file layout, abstractions, or coding conventions.

### General style

- Match the formatting, naming, types, and module conventions of the files you are changing.
- Use clear, descriptive names. Avoid abbreviations unless they are established project terminology.
- Keep functions focused and avoid deep nesting when a simple early return makes the flow clearer.
- Prefer explicit, readable code over clever one-liners or dense expressions.
- Avoid unnecessary comments, but document public contracts and non-obvious behavior with concise JSDoc where it helps callers.
- Do not refactor unrelated code, rename unrelated symbols, or reformat entire files as part of a focused change.
- Do not introduce a dependency for a small amount of functionality that can be implemented clearly with existing tools.
- Do not add an abstraction until there is a real repeated responsibility or boundary for it.

### TypeScript and runtime

- Follow the TypeScript configuration and existing type conventions. Keep types meaningful; do not use `any` to bypass a type problem.
- Prefer existing project types and narrow types at input boundaries.
- Do not use Node.js built-ins or Node-only APIs in plugin runtime code under `src/`, even if ESLint does not report a problem. Use Obsidian APIs or browser-compatible APIs as appropriate.
- Node.js APIs may be used in repository tooling and tests where they belong.
- Keep runtime dependencies compatible with Obsidian desktop and mobile. Check whether a dependency relies on Node or Electron before using it in runtime code.
- Use `async/await` for asynchronous control flow when it makes the sequence easier to follow. Handle rejected operations at the layer responsible for recovery or reporting.
- Avoid blocking the Obsidian runtime with synchronous or long-running work. Keep startup light and defer expensive work until it is needed.

### OnePlugin architecture

- Shared services and platform integration belong in `src/core/`; application-specific behavior belongs in `src/apps/<app>/`.
- Keep `src/main.ts` focused on Obsidian's plugin lifecycle and delegation to the OnePlugin runtime.
- Register application definitions through the existing registration path in `src/registry.ts`. Do not instantiate applications from arbitrary UI code or introduce directory scanning.
- Keep application definitions separate from runtime instances. Follow the current contracts in `src/core/types/application.ts` and the runtime flow in `src/core/runtime.ts`.
- Preserve deterministic application registration and startup order. Respect reverse-order shutdown.
- Do not invent lifecycle methods, context services, widget APIs, or cross-application communication APIs. Check the current types and accepted architecture first.
- Applications should not reach into another application's private implementation. Use an existing shared service or an explicitly designed communication contract.
- Keep MarkDB concerns within its own implementation boundary. Do not couple unrelated application or runtime code to MarkDB internals.

### Obsidian API and lifecycle

- Register user-facing commands with `addCommand()`; treat released command IDs as stable.
- Use Obsidian's registration and cleanup helpers for events, DOM listeners, intervals, and other lifecycle-bound resources.
- Ensure resources created by an application or view are released by the lifecycle owner. Avoid duplicate listeners or timers after reload.
- Use Obsidian APIs for vault and plugin behavior. Do not use Node filesystem APIs to access vault data.
- Consider desktop and mobile behavior. Do not assume Electron or desktop-only APIs are available.
- Keep vault scans, file reads, retained data, and startup work proportionate to the feature.

### UI and CSS

- Keep UI text short, clear, and in sentence case. Follow Obsidian's interaction and accessibility conventions.
- Prefer Obsidian components and DOM helpers where appropriate. Use safe text APIs; avoid unsafe HTML insertion.
- Preserve keyboard access, accessible labels, focus behavior, and sensible empty/loading/error states.
- Check the owning application's existing UI and `src/styles.css` before changing styles.
- Follow local CSS naming and scoping conventions. Avoid broad element selectors or rules that leak into other applications or Obsidian itself.
- Do not add global styling for a component that belongs to one application.

## Security and Privacy

- Prefer local operation. Add network access only when the feature clearly requires it; explain what data is sent, to whom, and why.
- Never add hidden telemetry, transmit vault content without explicit user consent, execute remote code, or add silent background uploads.
- Access only the data and files needed for the requested feature. Do not access files outside the vault unless a clearly justified, permitted requirement calls for it.
- Do not expose credentials, tokens, private vault content, or machine-specific configuration in logs, documentation, tests, or commits.
- Validate untrusted input at trust boundaries. Do not weaken validation or error handling for convenience.
- Use a dedicated Obsidian test vault for deployment and UI checks. Never deploy to a personal vault.

## Documentation Rules

- Keep documentation factual and aligned with the current implementation.
- Clearly label planned or reserved functionality as planned; do not describe it as available.
- Use [docs/README.md](docs/README.md) and [docs/dev/README.md](docs/dev/README.md) to navigate the documentation set.
- Put development setup and command instructions in `docs/dev/`, user-facing feature guidance in `docs/user/`, and significant architectural decisions in `docs/adr/`.
- Link to the owning source file when implementation detail needs a source of truth. Explain the design briefly instead of duplicating large code descriptions.
- Update indexes and nearby cross-references when adding, moving, or renaming a guide.
- Verify relative Markdown links, referenced file paths, and command names after documentation edits.

## Tests and npm Commands

Use the package scripts rather than recreating their commands. Run commands from the repository root.

- `npm run test:markdb` — run MarkDB tests.
- `npm run test:scripts` — run development-script tests.
- `npm test` — run both test groups.
- `npm run lint` — run ESLint.
- `npm run build` — run TypeScript checks and create the production bundle.
- `npm run check` — run lint and tests; it does not run the production build.
- `npm run dev` — run the esbuild watch process; this is long-running.
- `npm run deploy-test` — build and copy the plugin to the configured test vault. It may prompt to create `workflow.json`.

Start with the focused test for the changed area. Run lint, the full test suite, and the production build when appropriate to the scope. Use `npm run deploy-test` only when UI or Obsidian integration testing is needed and after confirming that the configured destination is a dedicated test vault. Read [docs/dev/SCRIPTS.md](docs/dev/SCRIPTS.md) for command effects and release-related behavior.

For filesystem tests, follow existing test patterns and use temporary directories. Do not add tests that depend on a developer's personal vault or machine-specific paths.

## Versioning, Git, and Release Safety

- Do not run `npm run release`, `npm version`, or other version/release commands unless the user explicitly requests a version change or release.
- A release workflow may update version files and changelog content, create commits and tags, and push to `origin`. Inspect the current release script and explain its effects before running it.
- Do not run `git add`, commit, tag, push, create branches, or alter Git history unless the user explicitly asks.
- Never commit `workflow.json`, local machine configuration, secrets, or generated build output.
- Preserve pre-existing working-tree changes. Never reset, clean, checkout over, or overwrite user changes as a shortcut.

## When to Ask

Ask a focused question before proceeding only when an unresolved detail could materially change public behavior, persisted data, compatibility, security, or release state.

Otherwise, make the smallest reasonable assumption, state it briefly, and proceed. Do not block straightforward work with questions whose answers can be established by inspecting the repository.

## Completion Standard

A task is complete when the requested outcome is implemented, all required parts of the change are addressed, relevant checks have been run, and the final report clearly separates:

- What changed.
- Which checks passed or failed.
- Which checks were not run.
- Any important assumptions, limitations, or remaining risks.

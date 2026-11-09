# AGENTS.md

Instructions for AI coding agents working in OnePlugin. Treat these as repository requirements whenever you inspect, edit, test, or document this project.

## Start Here

Before making changes, read the relevant parts of:

- [Contributing guide](CONTRIBUTING.md) for code, testing, and pull request expectations.
- [Development guide](docs/dev/DEVELOPMENT.md) for environment setup and test-vault use.
- [Architecture overview](ARCHITECTURE.md) for runtime structure and code ownership.
- [Package script reference](docs/dev/SCRIPTS.md) before choosing an npm command.

Read the owning implementation and its nearby tests before editing. Follow the current code and documentation if an older example or assumption differs from them. Do not invent a standard Obsidian sample-plugin layout for this repository.

## Project Facts

OnePlugin is an Obsidian desktop and mobile plugin. Runtime code is TypeScript and browser-compatible JavaScript built with esbuild. Node.js is for development, test, build, and release tooling, not plugin runtime modules.

- `src/main.ts` is the Obsidian plugin lifecycle entry point.
- `src/core/` owns app coordination, settings, shared types, and MarkDB integration.
- `src/widgets/` contains features; `src/widgets/index.ts` is the widget registry.
- `tests/markdb/` contains MarkDB tests; `tests/scripts/` contains Node tooling tests.
- `docs/dev/`, `docs/user/`, and `docs/adr/` contain developer guides, user documentation, and architecture decision records.
- `esbuild.config.mjs` outputs generated files under `build/<package-name>/` (currently `build/oneplugin-obsidian/`). Never hand-edit generated output.

For detailed ownership and lifecycle behavior, use [ARCHITECTURE.md](ARCHITECTURE.md).

## Required Working Practices

1. Establish the concrete task and inspect the relevant files, tests, and current Git changes before editing.
2. Keep changes scoped to the request. Preserve pre-existing user changes; do not revert, overwrite, or stage them.
3. Follow existing project patterns and the requirements in [CONTRIBUTING.md](CONTRIBUTING.md). Use meaningful names, focused functions, browser-compatible runtime APIs, and existing dependencies where possible.
4. Add or update tests for behavior changes. Keep tests in `tests/` and use temporary directories for filesystem tests.
5. Update the relevant documentation when commands, APIs, architecture, user behavior, or development workflow changes.
6. Run the narrowest relevant check first. For TypeScript or plugin changes, use the appropriate npm scripts below; report any checks you could not run and do not claim unrun checks passed.
7. Finish with a concise account of the files changed, checks run, and any remaining warnings or risks.

If requirements are ambiguous in a way that could change public behavior, persisted data, compatibility, or release state, ask before choosing an irreversible interpretation. Otherwise, make the smallest reasonable implementation and state the assumption.

## Code and Style

- Match the formatting and naming conventions of the neighboring files. TypeScript application code uses the existing types and module structure; do not convert it to a generic JavaScript widget scaffold.
- Keep functions focused. Handle invalid input and asynchronous failures at the boundary that owns them.
- Document public or non-obvious APIs with concise JSDoc, following nearby source conventions.
- Avoid new abstractions, dependencies, broad refactors, or unrelated cleanup unless the task needs them.
- Do not use Node.js built-ins in `src/` application code. Use Obsidian APIs for vault and plugin behavior.
- Register Obsidian commands with `addCommand()`, keep released command IDs stable, and register lifecycle-bound events using Obsidian cleanup helpers.
- Consider desktop and mobile behavior, keep startup work light, and avoid unnecessary vault scans or large retained data.
- Keep UI text short and sentence-case. Use Obsidian's UI components and DOM helpers where appropriate. Follow existing widget CSS naming and selectors; avoid generic global selectors and styles that leak into other widgets. Check the owning widget and `src/styles.css` before changing UI styling.
- Avoid unsafe HTML insertion and direct DOM patterns that conflict with the project's lint rules. Prefer Obsidian DOM helpers and safe text APIs.

## Security and Privacy

- Prefer local operation. Make network requests only for a clear feature requirement, and document external data use.
- Never add hidden telemetry, transmit vault content without explicit user consent, execute remote code, or access files outside the vault without a clear, permitted need.
- Do not expose credentials, tokens, private vault data, or local configuration in logs, docs, tests, or commits.
- Use a dedicated Obsidian test vault. Never deploy to a personal vault.

## Documentation Rules

- Keep documentation factual and aligned with current source behavior.
- Use [docs/README.md](docs/README.md) to navigate the documentation set.
- Put setup and command instructions in `docs/dev/`; user-facing feature guidance in `docs/user/`; significant architectural decisions in `docs/adr/`.
- Link to the owning source file when implementation detail needs a source of truth. Include a short explanation rather than duplicating large code descriptions.
- Verify relative Markdown links and command names after documentation edits.

## npm Commands

Use npm scripts rather than recreating their commands manually. Run commands from the repository root:

- `npm run test:markdb` — test MarkDB behavior.
- `npm run test:scripts` — test development scripts.
- `npm test` — run both test groups.
- `npm run lint` — run ESLint.
- `npm run build` — type-check and create the minified production bundle.
- `npm run dev` — run the esbuild watch process; this is long-running.
- `npm run deploy-test` — build and copy to the configured dedicated test vault; it can prompt to create `workflow.json`.
- `npm run check` — run lint and tests; it does not run the production build.

For normal validation, run the focused test first, then `npm run lint`, `npm test`, and `npm run build` as applicable. Run `npm run deploy-test` only for UI or Obsidian integration checks and only after confirming the configured vault is a dedicated test vault. See [docs/dev/SCRIPTS.md](docs/dev/SCRIPTS.md) for arguments and side effects.

## Versioning and Release Safety

Do not run `npm run release`, `npm version`, or other version/release commands unless the user explicitly asks for a release or version change. The release script can modify version files, update the roadmap/changelog, create a commit and tag, and push to `origin`.

Do not run `git add`, commit, tag, push, create branches, or alter Git history unless explicitly requested. Never commit `workflow.json` or generated build output. Preserve unrelated changes in the working tree.

When a user explicitly requests release work, inspect the current release helper and workflow first, explain the operations that modify or publish remote state, and verify version consistency and built assets before proceeding. The authoritative command details are in [docs/dev/SCRIPTS.md](docs/dev/SCRIPTS.md).

## Completion Standard

A task is complete when the requested change is implemented, relevant automated checks have been run, documentation is current where needed, and the final response distinguishes passed checks from warnings, failures, or checks not run.

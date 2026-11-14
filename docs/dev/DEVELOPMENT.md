<!-- markdownlint-disable MD010 -->

# Development Setup

Use Node.js and npm for development, plus a separate Obsidian vault for testing. Do not use a personal vault.

## Setup

```sh
npm install
```

Create a dedicated test vault and configure `workflow.json` in the repository root:

```json
{
	"testVaultPath": "/absolute/path/to/test-vault",
	"pluginPath": "/absolute/path/to/test-vault/.obsidian/plugins/oneplugin"
}
```

Use the plugin ID from `manifest.json` (`oneplugin`) in the destination path. Keep `workflow.json` local; it contains machine-specific paths and must not be committed. If the file is absent or invalid, `npm run deploy-test` prompts for a vault path and creates the configuration.

## Daily workflow

Start the watch build while editing:

```sh
npm run dev
```

This rebuilds the plugin when source files change.

When you want to test your changes in Obsidian, run:

```sh
npm run deploy-test
```

This creates a fresh production build and copies it into the configured test vault. Open the test vault in Obsidian and reload OnePlugin to test the changes. Deployment does not launch or reload Obsidian.

Before submitting, run:

```sh
npm test
npm run lint
npm run build
```

The [script reference](SCRIPTS.md) explains every package command, supported arguments, and side effects. The [architecture overview](../../ARCHITECTURE.md) describes the runtime and source layout.

## Where to work

- `src/core/` — app coordination, settings, shared types, and MarkDB.
- `src/widgets/` — user-facing feature implementations and widget registration.
- `tests/` — automated tests; MarkDB tests are in `tests/markdb/` and script tests in `tests/scripts/`.
- `docs/` — developer guides, user documentation, and architecture decision records.
- Root `.mjs` files — build, deployment, changelog, version, and release tooling.

Build output is generated under `build/`; do not edit or commit it manually. For contribution expectations, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

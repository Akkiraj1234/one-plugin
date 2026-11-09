# Architecture

OnePlugin is an Obsidian plugin built with TypeScript and bundled for the browser environment.

This document describes its runtime structure, storage, and build process.

## 1. Runtime Structure

The plugin starts at `src/main.ts`, which manages the Obsidian plugin lifecycle.

It initializes `AkkiObsidianApp`, responsible for coordinating application startup:

1. Loads persisted settings.
2. Initializes MarkDB.
3. Loads registered widgets.

### Core

`src/core/` contains shared application functionality, including:

- Application coordination.
- Settings management and UI.
- Shared types and definitions.
- MarkDB storage.

### Widgets

`src/widgets/` contains the individual features of OnePlugin.

Each widget receives a context containing the plugin instance, application coordinator, and its settings.

The widget registry at `src/widgets/index.ts` determines which widgets are registered and loaded.

### Data and Persistence

OnePlugin uses two storage mechanisms:

- **Plugin settings:** Persisted through Obsidian's plugin data API.
- **MarkDB:** Stores hobby data in the vault using Obsidian's vault API.

## 2. Build and Release

The build process is configured in `esbuild.config.mjs`.

It bundles:

- `src/main.ts` into `main.js`.
- `src/styles.css` into `styles.css`.

It also copies `manifest.json` and `LICENSE` into the production output directory.

The generated files are placed in:

```text
build/akki-obsidian/
├── main.js
├── manifest.json
├── styles.css
└── LICENSE
```

### Development Deployment

Development deployment is handled separately by `deploy-test.mjs`.

It:

1. Builds the plugin.
2. Copies the required production files into the configured test vault.
3. Leaves Obsidian launching and reloading to the developer.

### Release Workflow

GitHub Actions handles release publishing when a version tag is pushed.

The workflow verifies version consistency, builds the plugin, generates build provenance, and publishes the generated files as GitHub Release assets.

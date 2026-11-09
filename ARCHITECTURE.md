# Architecture

OnePlugin is an Obsidian desktop and mobile plugin. Its TypeScript application code runs in Obsidian's browser environment; Node.js is used only by development, test, build, and release scripts.

## Runtime flow

1. Obsidian loads `src/main.ts` and calls the plugin's `onload()` method.
2. The plugin delegates initialization to `AkkiObsidianApp` in `src/core/app.ts`.
3. The coordinator loads plugin settings, initializes MarkDB, then creates widgets listed in `src/widgets/index.ts`.
4. On unload, it saves settings and calls each widget's unload hook.

`src/core/types.ts` defines the widget definition, runtime, and settings-context contracts. The settings tab in `src/core/settings_tab.ts` renders settings contributed by registered widgets.

## Source ownership

| Location           | Responsibility                                                    |
| ------------------ | ----------------------------------------------------------------- |
| `src/main.ts`      | Obsidian plugin lifecycle entry point                             |
| `src/core/`        | Application coordination, settings, shared types, and persistence |
| `src/core/markdb/` | MarkDB formats, parsing, validation, registry, and public API     |
| `src/widgets/`     | User-facing features registered by `src/widgets/index.ts`         |
| `tests/`           | MarkDB and development-script tests                               |
| `docs/`            | Developer, user, and architecture-decision documentation          |

To add a widget, implement its definition and runtime in `src/widgets/`, then register it in `src/widgets/index.ts`. The app uses that registry for initialization and default settings.

## Settings and data

Plugin and widget settings are stored with Obsidian's `loadData()` and `saveData()` APIs. Widget settings are keyed by widget ID; defaults are merged with saved values in `AkkiObsidianApp`.

Hobby records are stored in the vault through MarkDB. `src/core/markdb/maindb.ts` opens a schema-validated database using Obsidian's vault adapter. The MarkDB package also supports JSON, line-oriented file, and structured database formats; see `src/core/markdb/index.ts` for its public exports.

The GitHub Activity widget fetches public activity from GitHub. Its request and response handling are in `src/widgets/new_tab/api.ts`; its view and actions are in `src/widgets/new_tab/`.

## Build and test

`esbuild.config.mjs` bundles `src/main.ts` and `src/styles.css` into `build/<package-name>/`, and copies `manifest.json` and `LICENSE`. The package name currently makes the output directory `build/oneplugin-obsidian/`. `npm run dev` watches source files; `npm run build` runs the TypeScript check and a minified production build.

`deploy-test.mjs` reads `workflow.json`, builds the plugin, and copies files into the configured test-vault plugin directory. Use a dedicated test vault; deployment does not launch Obsidian. See [the development guide](docs/dev/DEVELOPMENT.md) and [package script reference](docs/dev/SCRIPTS.md).

## Releases

`release.mjs` is intended to validate the Git state, run checks, synchronize version metadata, update the changelog, build, create a release commit and tag, and push them. `.github/workflows/release.yml` publishes assets when a tag is pushed.

The release workflow derives its artifact directory from the package name, matching the build configuration. See [the script reference](docs/dev/SCRIPTS.md) for release command behavior and side effects.

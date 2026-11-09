# Contributing to OnePlugin

Contributions should be focused, tested, and consistent with the existing Obsidian plugin architecture.

## Before changing code

- Check existing issues and discuss substantial features or behavior changes before implementation.
- Work on a topic branch rather than directly on `main`.
- Read [the architecture overview](ARCHITECTURE.md) and [development setup](docs/dev/DEVELOPMENT.md).

## Make the change

- Follow the existing ownership boundaries: shared behavior belongs in `src/core/`, and user-facing features belong in `src/widgets/`.
- Keep application code browser-compatible. Node.js modules belong in development and build tooling, not plugin runtime code.
- Reuse local patterns and dependencies; validate inputs and handle asynchronous failures.
- Keep command IDs and persisted settings keys stable after release. Document API or data-format changes and their compatibility impact.
- Add or update tests under `tests/`. Use existing test conventions and keep filesystem tests isolated in temporary directories.
- Update the relevant guide under `docs/` when behavior, setup, or workflow changes.

For example, after changing a MarkDB parser, add a focused test under `tests/markdb/`, then run:

```sh
npm run test:markdb
npm run lint
```

For a UI change, also build and deploy to a dedicated test vault:

```sh
npm run deploy-test
```

See [the package script reference](docs/dev/SCRIPTS.md) for all commands and their effects. Never test in a personal vault or commit `workflow.json`.

## Code and documentation style

- Use meaningful names and focused functions; follow the surrounding file's formatting.
- Document non-obvious public APIs and important behavior with JSDoc or nearby documentation.
- Keep user-facing text concise and consistent with Obsidian conventions.
- Do not commit generated files from `build/` or local configuration unless a task explicitly requires them.
- Record consequential architectural decisions in `docs/adr/`.

## Pull requests

Before opening a Pull Request:

1. Run the relevant tests, `npm run lint`, and `npm run build`.
2. Test UI changes in a dedicated Obsidian vault, on desktop and mobile when practical.
3. Review the diff and remove unrelated changes or local configuration.
4. Describe what changed, why it changed, how it was tested, and link the related issue.
5. Include screenshots for visible UI changes.

Do not run release or version commands as part of routine development. The release command can commit, tag, and push; see its warning in [the script reference](docs/dev/SCRIPTS.md).

Contributions are distributed under the terms in [LICENSE](LICENSE).

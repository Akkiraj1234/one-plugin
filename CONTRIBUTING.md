# Contributing to OnePlugin

Hey there! 👋

Welcome to OnePlugin, and thank you for your interest in contributing!

Whether you're fixing a bug, improving existing features, updating documentation, or building something new, we're happy to have you here.

## Table of Contents

- [Before You Start](#before-you-start)
- [Getting Started](#getting-started)
- [Making Changes](#making-changes)
- [Code and Documentation Style](#code-and-documentation-style)
- [Pull Requests](#pull-requests)
- [Releases](#releases)
- [License](#license)

## Before You Start

If you use an AI coding agent, make sure it follows the repository requirements in [AGENTS.md](./AGENTS.md). Those instructions cover project architecture, Obsidian-specific constraints, testing, and preserving local changes.

Before making changes, I recommend reading these documents:

1. [Architecture Overview](./ARCHITECTURE.md) — Understand how OnePlugin is designed and how its main parts work together.
2. [Development Setup](./docs/dev/DEVELOPMENT.md) — Set up your development environment.
3. [Architecture Decision Records (ADRs)](./docs/adr/README.md) — Check the decisions related to the area you want to work on.
4. [Developer Documentation](./docs/dev/README.md) — Find setup, scripts, roadmap, and architecture guides.

**Please follow these guidelines before contributing:**

- Check existing issues before starting work.
- For bugs, new features, or major changes, create an issue first so we can discuss the approach.
- Small fixes, such as typos and documentation improvements, can be submitted directly.
- Work on a separate branch instead of making changes directly to `main`.
- Keep your contributions focused and related to the issue or task.

## Getting Started

> For detailed instructions and commands, please read the [Getting Started Guide](./docs/dev/GettingStarted.md#1-set-up-your-development-environment).

The basic contribution workflow is:

1. Fork the OnePlugin repository.
2. Clone your fork to your local machine.
3. Set up your development environment.
4. Create a new branch for your changes.
5. Make your changes and add or update tests where needed.
6. Run the relevant checks before submitting your pull request.

Use a descriptive branch name, for example:

```sh
git checkout -b fix/markdb-parser
```

## Making Changes

When working on OnePlugin, please follow these guidelines:

- Follow the existing project structure. Shared functionality belongs in `src/core/`, while individual applications belong in `src/apps/`.
- Keep plugin code compatible with the browser environment.
- **Do not use Node.js modules or Node.js APIs inside the plugin runtime.** This applies even if ESLint does not report an issue. Node.js modules should only be used in development and build tools.
- Follow existing coding patterns and reuse available dependencies.
- Keep command IDs and saved settings keys stable after release.
- Document API or data format changes and explain their impact on existing users.
- Add or update tests under `tests/`. Follow existing test conventions and use temporary directories for filesystem tests.
- Update relevant documentation under `docs/` when behaviour, setup, or workflows change.

For example, if you modify a MarkDB parser, add focused tests under `tests/markdb/` and run:

```sh
npm run test:markdb
npm run lint
```

For UI changes, also build and deploy the plugin to a dedicated test vault:

```sh
npm run deploy-test
```

> **Important!**
>
> - Never use your personal Obsidian vault for testing.
> - Never commit `workflow.json`.
> - Check the [Package Script Reference](./docs/dev/SCRIPTS.md) to understand the available commands and what they do.

## Code and Documentation Style

- Use clear names and keep functions focused.
- Follow the formatting and coding style of the surrounding files.
- Document important behaviour and public APIs using JSDoc or nearby documentation.
- Keep user-facing text simple and consistent with Obsidian's UI conventions.
- Record important architectural decisions in `docs/adr/`.

## Pull Requests

> For detailed instructions and commands, please read the [Getting Started Guide](./docs/dev/GettingStarted.md#2-create-and-submit-a-pull-request).

Once your changes are ready, you can open a pull request.

Before submitting, make sure you have:

- [ ] Run the relevant tests.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Tested UI changes in a dedicated Obsidian test vault.
- [ ] Checked your changes for unrelated files or local configuration.
- [ ] Updated relevant documentation.
- [ ] Added or updated tests where needed.
- [ ] Linked the related issue, if applicable.
- [ ] Added screenshots if your changes affect the UI.

When creating your pull request, please include:

- A short description of what you changed.
- Why the change was needed.
- How you tested it.
- The related GitHub issue number, if applicable.

Pull requests may need changes before they can be merged. Maintainers may leave feedback or request improvements, so please keep an eye on your pull request after submitting it.

## Releases

Please do not run release or version commands during normal development.

The release command can modify files, create commits and tags, and push changes. Check the warning in the [Package Script Reference](./docs/dev/SCRIPTS.md) before using it.

## License

All contributions are distributed under the terms of the [LICENSE](./LICENSE) file.

---

Thanks again for taking the time to contribute to OnePlugin. Every improvement, whether big or small, helps make the project better.

Happy coding! ❤️

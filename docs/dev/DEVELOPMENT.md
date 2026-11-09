# Development Guide

Welcome to **OnePlugin**.

This guide covers the essentials of setting up your environment, navigating the codebase, and contributing to the project.

## Contents

1. [Getting Started](#1-getting-started)
2. [Development Workflow](#2-development-workflow)
3. [Project Structure](#3-project-structure)
4. [Widget Guidelines](#4-widget-guidelines)
5. [Code Guidelines](#5-code-guidelines)
6. [Submitting Changes](#6-submitting-changes)

---

## 1. Getting Started

### Fork and Clone

Fork the [OnePlugin repository](https://github.com/Akkiraj1234/one-plugin), then clone your fork locally.

You can keep the repository anywhere on your computer. It does not need to be inside an Obsidian vault.

### Create a Branch

Create a separate branch for your changes.

```bash
git switch -c feature/your-feature
```

Avoid working directly on `main`.

### Install Dependencies

```bash
npm install
```

### Configure a Test Vault

Create a separate Obsidian vault for development. Avoid using your personal vault.

Create `workflow.json` in the repository root:

```json
{
	"testVaultPath": "/path/to/test-vault",
	"pluginPath": "/path/to/test-vault/.obsidian/plugins/oneplugin"
}
```

Replace both paths with your actual test vault and plugin directory paths. The plugin directory must use the ID from `manifest.json`.

**Keep `workflow.json` local. Never commit or push it.**

---

## 2. Development Workflow

### Available Commands

| Command               | Description                                     |
| --------------------- | ----------------------------------------------- |
| `npm run dev`         | Start the development build in watch mode.      |
| `npm run build`       | Create a production build.                      |
| `npm run deploy-test` | Build and copy the plugin into your test vault. |
| `npm test`            | Run the test suite.                             |
| `npm run lint`        | Check code with ESLint.                         |

### Recommended Workflow

For everyday development:

```bash
npm run deploy-test
```

This builds the plugin and copies the required files into your configured test vault.

The command does not launch Obsidian. Open your test vault and reload OnePlugin manually to load the updated build.

Before submitting changes, run:

```bash
npm run lint
npm test
npm run build
```

Version and release commands are not needed for regular development.

---

## 3. Project Structure

The application source lives inside `src/`.

```text
src/
├── core/       # Core logic and shared functionality
├── widgets/    # Individual widgets
└── main.ts     # Plugin entry point

tests/          # Test suite
docs/           # Project documentation
build/          # Generated production files
```

Do not manually modify generated files inside `build/`.

### Where to Make Changes

| Location     | Purpose                            |
| ------------ | ---------------------------------- |
| `src/`       | Application logic and features     |
| `tests/`     | Automated tests                    |
| `docs/`      | Documentation                      |
| Root scripts | Development and release automation |

Avoid changing root configuration and build scripts unless your work requires it.

---

## 4. Widget Guidelines

Each widget should follow this basic structure:

```text
WidgetName/
├── index.js
└── index.css
```

### CSS Naming

Use widget-specific prefixes for CSS classes to avoid conflicts.

For a widget named `HManager-panel`:

```css
.HManager-panel-container {
	/* Styles */
}

.HManager-panel-header {
	/* Styles */
}
```

Avoid generic class names:

```css
.container {
}
.header {
}
.button {
}
```

### Shadow DOM

Most root-level widgets do not use Shadow DOM.

Prefer widget-specific CSS prefixes. Use Shadow DOM when a widget genuinely needs isolated styles.

---

## 5. Code Guidelines

- Keep application code free of Node.js modules.
- Avoid unnecessary dependencies.
- Reuse existing functionality where practical.
- Follow the established project structure.
- Write tests for new functionality.
- Follow the rules in `CONTRIBUTING.md`.

Node.js modules are permitted in development, testing, and build scripts, but not in application code.

For detailed contribution rules, see [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

---

## 6. Submitting Changes

Before opening a Pull Request:

1. Run the tests and linter.
2. Test your changes in an Obsidian test vault.
3. Review your changes.
4. Push your branch to your fork.
5. Open a Pull Request against `main`.

### Pull Request Checklist

- [ ] Reference the related issue, if applicable.
- [ ] Explain what changed and why.
- [ ] Include screenshots for UI changes.
- [ ] Include relevant tests.
- [ ] Exclude local configuration and unnecessary generated files.

Wait for review and approval before merging.

---

**Thank you for contributing to OnePlugin.**

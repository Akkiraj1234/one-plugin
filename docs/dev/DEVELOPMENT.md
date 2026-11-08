# Development Guide

Welcome to OnePlugin!

This guide explains how to set up your development environment and work on the codebase.

## Table of Contents

1. [Read First](#1-read-first)
2. [Environment Setup](#2-environment-setup)
3. [Development Tools](#3-development-tools)
4. [Project Structure](#4-project-structure)
5. [Where to Make Changes](#5-where-to-make-changes)
6. [Widget Guidelines](#6-widget-guidelines)
7. [Code Restrictions](#7-code-restrictions)
8. [Submitting Changes](#8-submitting-changes)

## 1. Read First

Before starting, read these documents:

- **CONTRIBUTING.md** — Contribution guidelines and coding rules.
- **ARCHITECTURE.md** — Project architecture and how components work together.
- **This guide** — Development setup and workflow.

## 2. Environment Setup

### Step 1: Fork and Clone

Fork the official repository:

[OnePlugin Repository](https://github.com/Akkiraj1234/one-plugin)

Clone your fork anywhere on your computer.

**Note:** You do not need to clone the repository inside your Obsidian vault.

### Step 2: Create a Branch

Create a separate branch for the issue you are working on.

Do not work directly on `main`.

### Step 3: Install Dependencies

Run this command inside the repository:

```bash
npm install
```

### Step 4: Configure Your Test Vault

Create a separate, preferably empty, Obsidian vault for testing.

Create a `workflow.json` file in the repository root:

```json
{
	"testVaultPath": "/path/to/your/test-vault"
}
```

Replace the path with your test vault's location.

**Important:**

- Never use your personal vault for testing.
- You can keep the repository anywhere on your computer.
- `build-test` automatically copies the build files into your configured vault.
- Never commit or push `workflow.json`.

## 3. Development Tools

Use these commands during development:

| Command              | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `npm run build-test` | Build the plugin and copy it to your test vault. |
| `npm test`           | Run tests.                                       |
| `npm run dev`        | Start the development build in watch mode.       |
| `npm run build`      | Create a production build.                       |
| `npm run lint`       | Check code using ESLint.                         |

### Recommended Workflow

For regular development, use:

```bash
npm run build-test
```

After the build:

- If Obsidian is already open, reload OnePlugin.
- If Obsidian is closed, the command attempts to open your test vault.

You do not need to use the `version` or `release` commands.

## 4. Project Structure

The main code is inside `src/`.

| Directory      | Purpose                                            |
| -------------- | -------------------------------------------------- |
| `src/core/`    | Core logic and shared functionality.               |
| `src/widgets/` | Individual widgets.                                |
| `src/plugin/`  | Main plugin implementation and widget integration. |
| `build/`       | Generated build files.                             |

Do not manually modify files inside `build/`.

## 5. Where to Make Changes

You can work on:

- `src/` — Plugin code and features.
- `docs/` — Documentation.
- `test/` — Tests.

Avoid modifying these files unless required:

- `.gitignore`
- Root configuration files.
- Build scripts.
- Release scripts.

## 6. Widget Guidelines

Every widget must follow this structure:

```text
WidgetName/
├── index.js
└── index.css
```

### CSS Rules

- Import the widget's stylesheet through `index.css`.
- Use the widget ID as a prefix for CSS classes.
- Avoid generic class names.

For example, if the widget ID is `HManager-panel`:

```css
.HManager-panel-container {
	/* Styles */
}

.HManager-panel-header {
	/* Styles */
}
```

Avoid:

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

Use widget-specific CSS prefixes to avoid style conflicts.

You can use Shadow DOM for independent widgets when needed.

## 7. Code Restrictions

- Do not use Node.js modules in application code.
- Avoid unnecessary external dependencies.
- Reuse existing functionality where possible.
- Maintain the existing project structure.
- Follow the rules in `CONTRIBUTING.md`.

Node.js modules are allowed in development and build scripts, but not in the application code.

## 8. Submitting Changes

Before submitting a Pull Request:

1. Run the relevant tests.
2. Run the linter.
3. Test your changes in your Obsidian test vault.
4. Review your changes.
5. Push your branch to your fork.
6. Open a Pull Request against the official repository's `main` branch.

### Pull Request Requirements

- Mention the related issue number.
- Explain what you changed.
- Explain why you made the changes.
- Include screenshots for UI changes.
- Do not include local configuration or unnecessary generated files.

Wait for the review and approval of your Pull Request.

---

Thank you for contributing to OnePlugin!

# Contributing to OnePlugin

Thank you for your interest in contributing to **OnePlugin**!

OnePlugin aims to make organising life in Obsidian easier through useful tools and a simple user experience.

Whether you're fixing a bug, improving existing functionality, or proposing a new feature, contributions are welcome.

Please take a moment to read these guidelines before getting started.

## Contents

1. [Before You Start](#1-before-you-start)
2. [Project Structure](#2-project-structure)
3. [Coding Guidelines](#3-coding-guidelines)
4. [Development and Testing](#4-development-and-testing)
5. [Documentation](#5-documentation)
6. [Pull Requests](#6-pull-requests)
7. [License](#7-license)

---

## 1. Before You Start

Before working on a change:

- Check existing issues to avoid duplicate work.
- Create an issue describing the bug or proposed feature.
- Wait for approval before starting implementation.
- Reference the related issue in your Pull Request.

Please avoid submitting unrelated or unapproved feature changes.

## 2. Project Structure

The project is organized into three main directories:

| Directory | Purpose                          |
| --------- | -------------------------------- |
| `src/`    | Plugin source code and features. |
| `tests/`  | Automated test suites.           |
| `docs/`   | Project documentation.           |

Maintain the existing structure when adding new files.

For a detailed overview, see [ARCHITECTURE.md](ARCHITECTURE.md).

## 3. Coding Guidelines

Write code that is readable, maintainable, and consistent with the existing codebase.

- Use meaningful names for variables, functions, and classes.
- Keep functions focused and responsibilities clear.
- Follow existing naming conventions.
- Handle errors and invalid inputs appropriately.
- Reuse existing functionality where practical.
- Avoid unnecessary dependencies and complexity.
- Maintain the established project architecture.

### Documentation

Document every function, method, and class using JSDoc.

Include relevant information:

- Purpose and behaviour.
- Parameters and their types.
- Return values.
- Errors thrown, where applicable.

Example:

```js
/**
 * Retrieves a hobby by its unique identifier.
 *
 * @param {string} hobbyId - Unique hobby identifier.
 * @returns {Object|null} Hobby data, or null if not found.
 */
get(hobbyId) {
    // Implementation
}
```

### API Changes

When modifying an existing API:

- Update its documentation.
- Explain the reason for the change.
- Document breaking changes and their impact.
- Mention relevant API changes in your commit.

If a change affects release compatibility or versioning, document the required version impact.

### Architecture

- Follow existing architectural patterns.
- Keep APIs consistent and predictable.
- Avoid unnecessary dependencies.
- Consider backward compatibility before introducing breaking changes.
- Record significant architectural decisions in `docs/adr/`.

## 4. Development and Testing

Test your changes before submitting a Pull Request.

### Obsidian Testing

- Use a dedicated test vault.
- Never test development builds in your personal vault.
- Follow the setup instructions in [`docs/dev/`](docs/dev/).
- Verify that your changes work correctly inside Obsidian.

Use the project's development tools to build and deploy your changes.

### Local Configuration

Development uses a local `workflow.json` file.

- Configure it for your own environment.
- Never commit or push `workflow.json`.
- Do not include personal machine paths or local configuration in commits.

## 5. Documentation

Keep documentation accurate and consistent with the implementation.

Update the relevant documentation whenever functionality, APIs, or development workflows change.

| Location     | Purpose                                        |
| ------------ | ---------------------------------------------- |
| `docs/dev/`  | Development guides and implementation details. |
| `docs/user/` | User-facing guides and instructions.           |
| `docs/adr/`  | Architectural decisions.                       |

## 6. Pull Requests

Before submitting:

1. Run the relevant tests.
2. Run the linter.
3. Test your changes in a dedicated Obsidian vault.
4. Update relevant documentation.
5. Review your changes.
6. Ensure local configuration and unnecessary generated files are excluded.

### Pull Request Requirements

- Reference the related GitHub issue.
- Clearly explain what changed and why.
- Include screenshots for UI changes, where applicable.
- Keep each Pull Request focused on its intended issue or feature.

Wait for review and approval before merging.

## 7. License

By contributing to OnePlugin, you agree that your contributions will be distributed under the project's **GNU General Public License v3.0 (GPL-3.0)**.

- Only submit code and assets you have the right to contribute.
- See the [`LICENSE`](LICENSE) file for the complete terms.

---

Thank you for helping make OnePlugin better!

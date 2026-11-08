# Contributing to OnePlugin

Thank you for your interest in contributing to OnePlugin!

OnePlugin aims to make organising life in Obsidian easier through useful tools and a simple user experience.

Contributions are welcome, including bug fixes, improvements, new features and ideas.

Please follow the guidelines below before contributing.

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Before You Start](#2-before-you-start)
3. [Coding Guidelines](#3-coding-guidelines)
    - [Documentation](#documentation)
    - [API Changes](#api-changes)
    - [Architecture](#architecture)
4. [Development and Testing](#4-development-and-testing)
    - [Obsidian Testing](#obsidian-testing)
    - [Local Configuration](#local-configuration)
5. [Documentation Guidelines](#5-documentation-guidelines)
6. [Contributors](#6-contributors)
7. [Pull Requests](#7-pull-requests)
8. [License](#8-license)

## 1. Project Structure

The project is organized into three main directories:

| Directory | Description                                   |
| --------- | --------------------------------------------- |
| `src/`    | Main plugin code and feature implementations. |
| `docs/`   | Project documentation.                        |
| `test/`   | Test files and test suites.                   |

Maintain the existing directory structure when adding new files.

## 2. Before You Start

- Create a GitHub issue before starting work on any bug fix or feature.
- Wait for the issue to be approved before beginning implementation.
- Every Pull Request must reference its related issue.
- Do not work on unapproved features or changes.

## 3. Coding Guidelines

OnePlugin prioritizes readable, maintainable and well-documented code.

- Every function, method and class must be documented.
- Use meaningful variable and function names.
- Follow existing naming conventions.
- Keep functions focused on a single responsibility.
- Avoid unnecessary complexity and dependencies.
- Reuse existing functionality whenever possible.
- Handle errors and invalid inputs appropriately.
- Maintain the existing project architecture.

### Documentation

Use JSDoc to document functions and methods.

Include:

- Purpose of the function or method.
- Parameters and their types.
- Return values.
- Errors thrown, where applicable.

Example:

```js
/**
 * Retrieves a hobby by its unique identifier.
 *
 * @param {string} hobbyId - Unique identifier of the hobby.
 * @returns {Object|null} The hobby data, or null if not found.
 */
get(hobbyId) {
    // Implementation
}
```

### API Changes

Whenever you modify an existing API:

- Update the relevant documentation.
- Mention the API change in your commit.
- Include the version associated with the change.
- Explain why the change was necessary.
- Document breaking changes and their impact.

### Architecture

- Follow the existing project architecture.
- Keep APIs consistent and predictable.
- Avoid unnecessary dependencies.
- Do not introduce breaking changes without proper consideration.
- Document significant architectural decisions in `docs/adr/`.

## 4. Development and Testing

Always test your changes before submitting a Pull Request.

### Obsidian Testing

- Use a dedicated Obsidian test vault.
- Never test development builds in your personal vault.
- Follow the setup instructions in `docs/dev/`.
- Verify that your changes work correctly inside Obsidian.

### Local Configuration

OnePlugin uses a local `workflow.json` file for development configuration.

- Configure it for your own environment.
- Never commit or push `workflow.json`.
- Do not include personal machine paths or local configuration in commits.

## 5. Documentation Guidelines

Update documentation whenever necessary.

| Location     | When to update                             |
| ------------ | ------------------------------------------ |
| `docs/dev/`  | Developer APIs and implementation details. |
| `docs/user/` | User-facing features and instructions.     |
| `docs/adr/`  | Significant architectural decisions.       |

Keep documentation consistent with the implementation.

## 6. Contributors

Before submitting your first Pull Request, add your details to `CONTRIBUTORS.md`.

Include:

- Your name.
- Your email address used for the contribution.

Use the following format:

```markdown
| Name      | Email          |
| --------- | -------------- |
| Your Name | your@email.com |
```

Do not add another entry if you are already listed.

## 7. Pull Requests

Before submitting your Pull Request:

1. Make sure your changes follow the coding guidelines.
2. Run the relevant tests.
3. Run the linter.
4. Test your changes inside a dedicated Obsidian test vault.
5. Update the relevant documentation.
6. Add your details to `CONTRIBUTORS.md` if you are a new contributor.
7. Ensure local configuration files are not included.

### Pull Request Requirements

- Reference the related GitHub issue.
- Clearly describe what you changed.
- Explain why the changes were necessary.
- Include screenshots for UI changes, where applicable.
- Keep Pull Requests focused on one feature or issue.

Wait for review and approval before merging your changes.

## 8. License

By contributing to OnePlugin, you agree that your contributions will be distributed under the project's **GNU General Public License v3.0 (GPL-3.0)**.

- Only submit code and assets you have the right to contribute.
- See the `LICENSE` file for the complete license terms.

---

Thank you for contributing to OnePlugin!

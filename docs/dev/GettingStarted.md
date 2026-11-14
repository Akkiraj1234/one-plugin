<!-- markdownlint-disable MD036 MD007 -->

# Getting Started

Welcome to OnePlugin! 👋

This guide will help you set up OnePlugin for development and walk you through the process of contributing your changes through a pull request.

Before getting started, make sure you have a GitHub account and a separate Obsidian vault for testing. **Never use your personal vault to test plugin changes.**

## Table of Contents

- [1. Set Up Your Development Environment](#1-set-up-your-development-environment)
    - [Install the Required Tools](#install-the-required-tools)
    - [Verify Your Installation](#verify-your-installation)
    - [Fork and Clone the Repository](#fork-and-clone-the-repository)
    - [Prepare an Obsidian Test Vault](#prepare-an-obsidian-test-vault)
    - [Deploy OnePlugin](#deploy-oneplugin)
    - [Daily Development Workflow](#daily-development-workflow)
- [2. Create and Submit a Pull Request](#2-create-and-submit-a-pull-request)
    - [Create a Branch](#create-a-branch)
    - [Make and Test Your Changes](#make-and-test-your-changes)
    - [Commit and Push Your Changes](#commit-and-push-your-changes)
    - [Open a Pull Request](#open-a-pull-request)
    - [Writing a Good Pull Request](#writing-a-good-pull-request)
    - [After Submitting](#after-submitting)

---

## 1. Set Up Your Development Environment

### Install the Required Tools

You will need Git, Node.js, and npm to work on OnePlugin.

**Windows**

1. Install [Git for Windows](https://git-scm.com/download/win). It includes Git Bash and Git Credential Manager.
2. Install the current [Node.js LTS release](https://nodejs.org/). npm is included with the installer.

You can run the commands below in PowerShell, Windows Terminal, or Git Bash.

**macOS**

If you use [Homebrew](https://brew.sh/), install Git and Node.js with:

```bash
brew install git node
```

Alternatively, install Git and the current [Node.js LTS release](https://nodejs.org/) using their official installers.

**Linux**

Install Git and Node.js using your distribution's package manager. For Ubuntu or Debian:

```bash
sudo apt update
sudo apt install git nodejs npm
```

Some distribution repositories may not provide the current Node.js LTS release. If your installed version is outdated, follow the instructions on the [official Node.js website](https://nodejs.org/).

### Verify Your Installation

Open a new terminal and run:

```bash
git --version
node --version
npm --version
```

Make sure all three commands return a version number.

### Fork and Clone the Repository

1. Visit the [OnePlugin repository](https://github.com/Akkiraj1234/one-plugin) and click **Fork** to create your own copy under your GitHub account.

2. Clone your fork to your computer:

    ```bash
    git clone https://github.com/YOUR-USERNAME/one-plugin.git
    cd one-plugin
    ```

    Replace `YOUR-USERNAME` with your GitHub username.

3. Add the original OnePlugin repository as an `upstream` remote:

    ```bash
    git remote add upstream https://github.com/Akkiraj1234/one-plugin.git
    ```

4. Install the project dependencies:

    ```bash
    npm install
    ```

You now have two Git remotes:

- `origin` points to your personal fork.
- `upstream` points to the original OnePlugin repository.

This allows you to make changes in your own fork while keeping it connected to the original project.

### Prepare an Obsidian Test Vault

Create a new vault in Obsidian specifically for development. For example, name it `OnePlugin Test`.

Open the vault at least once so Obsidian creates its configuration folder.

**!! Do not use a vault containing your personal notes.**

### Deploy OnePlugin

From the repository root, run:

```bash
npm run deploy-test
```

On the first run, the script will ask for your test vault's absolute path. Enter the path without surrounding quotes.

Examples:

- Windows: `C:/Users/YOUR-NAME/Documents/OnePlugin Test`
- macOS: `/Users/YOUR-NAME/Documents/OnePlugin Test`
- Linux: `/home/YOUR-NAME/Documents/OnePlugin Test`

The script creates a local `workflow.json`, builds OnePlugin, and copies the plugin into:

```text
.obsidian/plugins/oneplugin
```

Keep `workflow.json` on your computer. It contains machine-specific paths and must never be committed.

If the script reports an invalid vault path, make sure you have opened the vault in Obsidian at least once and check that the path is correct.

Finally, open your test vault, go to **Settings → Community plugins**, and enable OnePlugin.

**Note:** The deployment script does not launch Obsidian or reload the plugin automatically. After deploying changes, reload OnePlugin in Obsidian to test the latest build.

### Daily Development Workflow

Once your environment is ready, start the development build:

```bash
npm run dev
```

This starts the watch build and rebuilds the plugin as you make changes.

When you want to test your changes, open another terminal and run:

```bash
npm run deploy-test
```

Before submitting your changes, run the relevant checks:

```bash
npm test
npm run lint
npm run build
```

For changes involving MarkDB, also run:

```bash
npm run test:markdb
```

For development-script changes, run:

```bash
npm run test:scripts
```

See the [Package Scripts](SCRIPTS.md) guide for a complete list of available commands.

Build output is generated under `build/`. Do not edit or commit generated build files.

---

## 2. Create and Submit a Pull Request

A pull request (PR) is how you propose changes to the original OnePlugin repository.

You work on your own fork, push your changes to GitHub, and then open a pull request asking the maintainers to review and merge those changes into the original project.

Think of it as saying:

"I've made this change, tested it, and would like to contribute it to OnePlugin."

> [!IMPORTANT]
> Before you start, read the [Contributing Guidelines](../../CONTRIBUTING.md#before-you-start).

### Create a Branch

From your local repository, create a new branch:

```bash
git switch -c fix/markdb-parser
```

Use a descriptive name that explains what you're working on.

Examples:

- `feature/new-widget`
- `fix/markdb-parser`
- `docs/update-guide`

### Make and Test Your Changes

Make your changes and check that they work as expected.

A few things to remember:

- Add or update tests under `tests/` when changing existing behavior.
- Update documentation when your changes affect functionality or development instructions.
- For UI changes, deploy the plugin to your dedicated test vault and verify the result.
- Run the relevant tests, lint checks, and build before submitting your work.
- Never include your local `workflow.json` or generated files under `build/`.

You can review your changes at any time with:

```bash
git status
```

### Commit and Push Your Changes

Stage only the files related to your contribution:

```bash
git add path/to/changed-file
```

Create a commit with a clear message:

```bash
git commit -m "Fix MarkDB parser behavior"
```

Then push your branch to your fork:

```bash
git push -u origin fix/markdb-parser
```

Replace the example branch name, file path, and commit message with your own.

### Open a Pull Request

After pushing your branch:

1. Open your fork on GitHub.
2. Select **Compare & pull request** or go to **Pull requests → New pull request**.
3. Make sure the base repository is `Akkiraj1234/one-plugin`.
4. Set the base branch to `main`.
5. Select your fork and feature branch as the compare branch.
6. Review the changes GitHub displays.
7. Write a clear title and description, then submit your pull request.

Your pull request should target the original repository, not your own fork.

### Writing a Good Pull Request

A good pull request makes it easy for maintainers to understand what you changed, why you changed it, and how they can verify it.

Keep the title short and specific. Use the description to explain the details.

**1. Pull Request Title**

Write a title that describes the actual change.

Examples:

Good:

- `Fix MarkDB parser handling of empty values`
- `Add keyboard navigation to the settings view`
- `Update development setup instructions`

Avoid vague titles such as:

- `Some changes`
- `Bug fixed`
- `Update`
- `My contribution`

**2. Pull Request Description**

Use Markdown headings and checklists to keep your description organized.

You can use this template when opening a pull request:

```markdown
## Summary

Briefly explain what this pull request changes.

## Motivation

Explain why this change is needed.
What problem does it solve, or what improvement does it provide?

## Changes Made

- Describe the first important change.
- Describe another relevant change.
- Mention any important implementation details.

## Testing

- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Tested in a separate Obsidian vault

Add any additional tests or steps you performed.

## Screenshots

Add screenshots here if your changes affect the UI.

## Related Issue

Closes #123
```

Remove sections that do not apply to your contribution. For example, you do not need screenshots for a documentation-only change.

**What should you write in each section?**

- **Summary:** Give a short overview of the change. Avoid explaining every implementation detail here.
- **Motivation:** Explain the problem you noticed or why the feature would be useful. Give enough context for someone who hasn't worked on the issue.
- **Changes Made:** List the important changes. Mention new functionality, changed behavior, or files and components that are relevant to the review.
- **Testing:** List the checks you actually ran. Only tick a checkbox when you have completed that check. If something could not be tested, explain why.
- **Screenshots:** For UI changes, show the before-and-after result or the new interface. This helps maintainers review visual changes without having to build the plugin immediately.
- **Related Issue:** Link the issue your PR addresses. If it completely resolves an issue, use `Closes #123` with the correct issue number. GitHub will automatically close that issue when the PR is merged.

**3. Example Pull Request**

Here is an example of what a well-written pull request might look like:

```markdown
## Summary

Fixes an issue where the MarkDB parser does not handle empty values correctly.

## Motivation

Empty values were being interpreted incorrectly, which could result in unexpected parser output.

This change makes the parser handle empty values consistently.

## Changes Made

- Updated the MarkDB parser's empty-value handling.
- Added test cases for empty values.
- Updated the relevant parser tests.

## Testing

- [x] `npm run test:markdb`
- [x] `npm run lint`
- [x] `npm run build`
- [x] Tested in a separate Obsidian vault

## Related Issue

Closes #123
```

The example is illustrative. When submitting your own PR, describe only the changes you actually made and the tests you actually ran.

### After Submitting

Keep an eye on your pull request for review comments and automated check results.

Maintainers may approve your changes or request revisions. If changes are requested:

1. Make the updates on the same feature branch.
2. Run the relevant checks again.
3. Commit and push the updates.

GitHub automatically adds your new commits to the existing pull request. You do not need to create another one.

Please do not run release or version commands as part of normal contribution work.

---

Thank you for taking the time to contribute to OnePlugin! ❤️

For more information, see:

- [Contributing Guidelines](../../CONTRIBUTING.md)
- [Architecture](../../ARCHITECTURE.md)
- [Development Guide](DEVELOPMENT.md)
- [Package Scripts](SCRIPTS.md)

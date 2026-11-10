 <div align="center">

  <img src="assets/one-pugin-big-logo.svg" alt="OnePlugin logo" width="112" />

# OnePlugin

**Organise your life, right inside Obsidian.**

Bring your hobbies, activities, plans, and everyday tools together in one connected workspace.

  <p>
    <a href="LICENSE"><img alt="GPL-3.0 License" src="https://img.shields.io/badge/license-GPL--3.0-9B7AE4?style=for-the-badge&labelColor=171421" /></a>
    <img alt="Latest release" src="https://img.shields.io/github/v/release/Akkiraj1234/one-plugin?style=for-the-badge&color=9B7AE4&labelColor=171421&label=release" />
    <img alt="Development status" src="https://img.shields.io/badge/status-in%20development-A78BFA?style=for-the-badge&labelColor=171421" />
  </p>

  <p>
    <a href="docs/user/README.md">Documentation</a>
    ·
    <a href="CONTRIBUTING.md">Contributing</a>
    ·
    <a href="https://github.com/Akkiraj1234/one-plugin/issues">Report an issue</a>
  </p>

</div>

<p align="center">
  <img src="assets/OnePlugin%20%E2%80%94%20Obsidian%20cover.png" alt="OnePlugin — a connected workspace for hobbies, activities, and everyday organisation inside Obsidian." width="100%" />
</p>

---

## ✨ What is OnePlugin?

OnePlugin is an everyday organisation toolkit built for [Obsidian](https://obsidian.md/).

It brings together tools for managing hobbies, planning activities, tracking progress, and creating a personalised workspace — all within your Obsidian vault.

Rather than scattering your everyday workflows across different tools, OnePlugin aims to bring them together in one place.

## 🚀 Features

### 🎨 Hobby Management

Organise your hobbies, structure them into categories, and keep track of the things you enjoy doing.

### 📅 Hobby Planning

Plan activities, maintain your routines, and track your progress over time.

### 🧩 Customisable New Tab

Turn your new tab into a personal workspace with configurable widgets and useful information.

### 🐙 GitHub Activity

Bring your public GitHub activity into your workspace and keep an eye on your development activity.

> OnePlugin is actively in development. Features, interfaces, and internal APIs are evolving, and some functionality may be incomplete or subject to change.

## 📖 Get Started

Whether you're using OnePlugin or exploring its codebase, there's documentation to help you get started.

**For users**

Visit the [User Documentation](docs/user/README.md) for feature guides, usage instructions, and help.

**For developers and contributors**

| Guide                                        | Description                                     |
| -------------------------------------------- | ----------------------------------------------- |
| [Development Guide](docs/dev/DEVELOPMENT.md) | Environment setup and development workflow      |
| [Package Scripts](docs/dev/SCRIPTS.md)       | Available commands, arguments, and side effects |
| [Contributing](CONTRIBUTING.md)              | Contribution guidelines and expectations        |
| [Architecture](ARCHITECTURE.md)              | Runtime structure and code ownership            |
| [Documentation Index](docs/README.md)        | Complete documentation index                    |
| [Architecture Decisions](docs/adr/README.md) | Important architectural decisions               |

## 🛠️ Development

Want to explore the code, experiment with features, or contribute?

### Requirements

- Node.js
- npm
- A dedicated Obsidian test vault

### Setup

Clone the repository and install its dependencies:

```bash
git clone https://github.com/Akkiraj1234/one-plugin.git
cd one-plugin
npm install
```

Configure your local `workflow.json` with the path to your dedicated Obsidian test vault.

Deploy the plugin to your test vault:

```bash
npm run deploy-test
```

For detailed setup instructions, see the [Development Guide](docs/dev/DEVELOPMENT.md).

For available commands and their behaviour, see the [Package Scripts](docs/dev/SCRIPTS.md).

## 🤝 Contributing

OnePlugin is an independent open-source project, and contributions are welcome.

Whether you've spotted a bug, have an idea for a new feature, or want to improve the existing codebase, your input is appreciated.

Before contributing:

1. Read the [Contributing Guidelines](CONTRIBUTING.md).
2. Check existing [GitHub Issues](https://github.com/Akkiraj1234/one-plugin/issues).
3. Open an issue to discuss substantial changes before starting implementation.

Small improvements, thoughtful feedback, and focused contributions all help make the project better.

## 📄 License

OnePlugin is distributed under the [GNU General Public License v3.0](LICENSE).

You are free to use, study, modify, and redistribute the project under the terms of the license.

---

# OnePlugin

**Organise your life, right inside Obsidian.**

OnePlugin brings everyday organisation tools into Obsidian — from managing hobbies and planning activities to useful widgets that keep everything within reach.

<escape>[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-0.1.3-informational)
![Status](https://img.shields.io/badge/status-in_development-yellow)</escape>

<escape><!-- Add project screenshot or banner here. --></escape>

## ✨ What can you do with OnePlugin?

- **Hobby Management** — Organise hobbies and track activities.
- **Hobby Planning** — Plan activities and follow your progress.
- **New Tab** — A configurable workspace with useful widgets.
- **GitHub Activity** — View public GitHub activity from your new tab.

<text color="secondary" size="sm">OnePlugin is actively developing. Features and interfaces are still evolving.</text>

## 🚀 Get Started

**Using OnePlugin?**

Explore the [User Documentation](docs/user/README.md) for feature guides and instructions.

**Want to contribute or explore the code?**

Start with these documents:

| Guide                                        | Purpose                               |
| -------------------------------------------- | ------------------------------------- |
| [Development Guide](docs/dev/DEVELOPMENT.md) | Setup and development workflow        |
| [Contributing](CONTRIBUTING.md)              | Contribution guidelines               |
| [Architecture](ARCHITECTURE.md)              | Understand how OnePlugin works        |
| [Source Overview](src/README.md)             | Explore the codebase                  |
| [Architecture Decisions](docs/adr/README.md) | Understand important design decisions |

## 🛠️ Development

Requirements: Node.js, npm, and a dedicated Obsidian test vault.

```bash
git clone https://github.com/Akkiraj1234/one-plugin.git
cd one-plugin
npm install
npm run deploy-test
```

Configure your local `workflow.json` before deployment. See the [Development Guide](docs/dev/DEVELOPMENT.md) for setup instructions.

| Command               | Purpose                |
| --------------------- | ---------------------- |
| `npm run dev`         | Development watch mode |
| `npm run build`       | Production build       |
| `npm run deploy-test` | Deploy to test vault   |
| `npm test`            | Run tests              |
| `npm run lint`        | Run ESLint             |

## 🤝 Contributing

Found a bug or have an idea? Contributions are welcome!

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and discuss your changes through a GitHub issue before implementation.

## 📄 License

OnePlugin is open source under the [GNU GPL-3.0 License](LICENSE).

---

**Thanks for stopping by. Happy organising!**

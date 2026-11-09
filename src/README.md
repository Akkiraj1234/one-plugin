# Source code

This folder contains the TypeScript and CSS bundled into the OnePlugin Obsidian plugin.

- `main.ts` connects Obsidian's plugin lifecycle to the application coordinator.
- `core/` contains the application coordinator, settings tab, shared types, and MarkDB implementation.
- `widgets/` contains the hobby manager and GitHub activity widgets.
- `styles.css` contains the plugin's styles.

Keep production plugin code in this folder and group related functionality by responsibility.

<!-- markdownlint-disable MD007 -->

# ADR 0001: Application Styling and CSS Build Strategy

> **Author** : [Akhand Raj](https://github.com/Akkiraj1234)  
> **Status** : Accepted  
> **Date** : 16 November 2026  
> **Decision:** Separate global application styles from Shadow DOM styles using filename conventions.

## Overview

This decision establishes how CSS is organized and handled across OnePlugin applications.

Each application can maintain its own stylesheets using two filename conventions: `index.css` for regular DOM styles and `shadow.css` for Shadow DOM styles. The build system automatically discovers and combines all `index.css` files into a single stylesheet, while `shadow.css` files are explicitly imported and embedded into the application as strings.

This keeps application styles organized, prevents unnecessary style conflicts, and gives applications control over their Shadow DOM styling. Please Read the following rules [index.css rules](#indexcss--global-dom-styles) and [shadow.css rules](#shadowcss--shadow-dom-styles).

## Table of Contents

- [Context](#context)
- [Decision](#decision)
    - [`index.css` — Global DOM styles](#indexcss--global-dom-styles)
    - [`shadow.css` — Shadow DOM styles](#shadowcss--shadow-dom-styles)
- [Build System Responsibilities](#build-system-responsibilities)
- [Alternatives Considered](#alternatives-considered)
- [Consequences](#consequences)
- [Example Structure](#example-structure)
- [Summary](#summary)

## Context

OnePlugin applications may render their UI in either the regular DOM or Shadow DOM. Each application should own its styles, while the build system should handle collecting global styles and embedding Shadow DOM styles.

## Decision

We will use two CSS filename conventions:

### `index.css` — Global DOM styles

- Each application can provide an `index.css` file.
- The build system automatically discovers all `index.css` files under `src/`.
- All discovered files are combined into a single `styles.css` file.
- Obsidian loads the generated stylesheet normally.
- Every application must follow a unique CSS namespace based on its application ID.

**Namespace convention:**

Use the `op-` prefix followed by the application ID in kebab-case.

For example:

```css
/* Hobby Manager */
.op-hobby-manager {
}
.op-hobby-manager .header {
}
.op-hobby-manager .container {
}

/* New Tab */
.op-new-tab {
}
.op-new-tab .header {
}
.op-new-tab .container {
}
```

Avoid unscoped selectors that could unintentionally affect other applications or Obsidian itself. Custom properties and keyframe names should also use application-specific names.

### `shadow.css` — Shadow DOM styles

- `shadow.css` files are not included in the global stylesheet.
- Applications must explicitly import their Shadow DOM stylesheet into their TypeScript files.

```ts
import shadowStyles from './shadow.css';
```

The build system uses esbuild's `text` loader to embed the CSS contents as a JavaScript string.

Applications are responsible for injecting these styles into their Shadow DOM:

```ts
const shadowRoot = container.attachShadow({ mode: 'open' });

const style = document.createElement('style');
style.textContent = shadowStyles;

shadowRoot.appendChild(style);
```

Shadow DOM provides style isolation, so application root namespace selectors are not required for these styles. However, custom properties and keyframe names should still be named carefully.

## Build System Responsibilities

| File               | Build behaviour                                         |
| ------------------ | ------------------------------------------------------- |
| `index.css`        | Automatically discovered and combined into `styles.css` |
| `shadow.css`       | Explicitly imported and embedded as a string            |
| Other `.css` files | Not automatically collected                             |

## Alternatives Considered

1. **Single root stylesheet:** All application styles would live in one central file. Rejected because applications should own their styles.
2. **Collect every CSS file globally:** Rejected because Shadow DOM styles must not leak into the global stylesheet.
3. **Manual stylesheet registration:** Rejected because applications should not need to register their global CSS individually.

## Consequences

- Applications own and maintain their stylesheets.
- Global styles are collected automatically during the build.
- Shadow DOM styles remain isolated from the global stylesheet.
- Developers must follow the application namespace convention for `index.css`.
- Applications are responsible for injecting their own Shadow DOM styles.
- Shadow CSS imported with the text loader is embedded as text; it does not automatically receive the same CSS processing as the global stylesheet.

## Example Structure

```text
src/
├── main.ts
├── registry.ts
├── core/
│   └── index.css
└── apps/
    ├── hobbyManager/
    │   ├── index.ts
    │   ├── metadata.ts
    │   └── index.css
    └── newTab/
        ├── index.ts
        ├── metadata.ts
        ├── render.ts
        ├── index.css
        └── shadow.css
```

## Summary

- `index.css` → Global DOM styles, automatically collected.
- `shadow.css` → Shadow DOM styles, explicitly imported.
- Global application selectors → Must follow the `op-{application-id}` namespace convention.

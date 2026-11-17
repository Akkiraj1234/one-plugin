# Package Scripts

Run all commands from the repository root. To pass arguments to an npm script, use `--`, for example:

```sh
npm run release -- patch
```

## Build and Test

| Command                | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Start the development build in watch mode.                |
| `npm run build`        | Run TypeScript checks and create a production build.      |
| `npm run deploy-test`  | Build and copy the plugin into the configured test vault. |
| `npm run test`         | Run all automated tests.                                  |
| `npm run test:plugin`  | Run The Test For The Plugin.                              |
| `npm run test:scripts` | Run development-script tests only.                        |
| `npm run lint`         | Run ESLint.                                               |
| `npm run check`        | Run lint and all automated tests.                         |

### Typical Workflow

Start the development build:

```sh
npm run dev
```

In another terminal, deploy the plugin to your test vault:

```sh
npm run deploy-test
```

Reload OnePlugin in your test vault to test the changes.

Before submitting changes, run:

```sh
npm test
npm run lint
npm run build
```

`scripts/deploy-test.mjs` handles test-vault validation and deployment, while `esbuild.config.mjs` handles bundling.

### CSS development limitation

The build collects `src/**/index.css` files before esbuild starts. While `npm run dev` is running, restart it after adding, removing, or editing an `index.css` file. Production builds and `npm run deploy-test` always collect the current files.

## Versioning and Releases

### Update the Version

To update the project version without creating a Git commit or tag:

```sh
npm version patch --no-git-tag-version
```

You can use `minor`, `major`, or an explicit stable version such as `1.2.0` instead of `patch`.

The version lifecycle script synchronizes the version in `manifest.json` and `versions.json`.

### Create a Release

Run the release script with the desired version increment or explicit version:

```sh
npm run release -- patch
```

Or:

```sh
npm run release -- 1.2.0
```

The release script runs the release workflow, including checks, version updates, changelog preparation, building, Git commit and tag creation, and pushing the release.

**Only run this command for an approved release with a clean Git working tree.**

The release workflow uses fully qualified Git refs when checking and pushing tags. It also derives `BUILD_DIR` from the package name and uses it consistently for artifact validation, provenance attestation, and release uploads.

Release notes are extracted from the matching version section in `changelog.md` using `scripts/release-notes.mjs` and used as the GitHub release description.

## Roadmap Helper

After marking completed tasks in `roadmap.md`, run:

```sh
node scripts/update-changlog.mjs
```

The helper transfers completed tasks into the current package version's section in `changelog.md` and removes them from the roadmap.

See the [Roadmap](../../roadmap.md) and [Roadmap Guide](ROADMAP.md) for the required format and instructions.

## Source References

- [`package.json`](../../package.json) — Available npm commands.
- [`esbuild.config.mjs`](../../esbuild.config.mjs) — Build configuration.
- [`scripts/build/buildcss.js`](../../scripts/build/buildcss.js) — Application stylesheet discovery and Shadow CSS text imports.
- [`scripts/deploy-test.mjs`](../../scripts/deploy-test.mjs) — Test deployment.
- [`scripts/version-bump.mjs`](../../scripts/version-bump.mjs) — Version synchronization.
- [`scripts/release.mjs`](../../scripts/release.mjs) — Release automation.
- [`scripts/release-notes.mjs`](../../scripts/release-notes.mjs) — Release notes extraction.
- [`scripts/update-changlog.mjs`](../../scripts/update-changlog.mjs) — Changelog helper.
- [Release workflow](../../.github/workflows/release.yml) — GitHub release publishing.

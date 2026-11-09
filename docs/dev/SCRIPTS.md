# Package Scripts

Run all commands from the repository root. Pass arguments to npm scripts using `--`, for example `npm run release -- patch`.

## Build and test

| Command                | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Watch source files and rebuild during development.        |
| `npm run build`        | Type-check and create a minified production build.        |
| `npm run deploy-test`  | Build and copy the plugin into the configured test vault. |
| `npm test`             | Run all automated tests.                                  |
| `npm run test:markdb`  | Run MarkDB tests only.                                    |
| `npm run test:scripts` | Run development-script tests only.                        |
| `npm run lint`         | Run ESLint.                                               |
| `npm run check`        | Run lint and tests.                                       |

### Typical workflow

```sh
npm run dev
```

In another terminal:

```sh
npm run deploy-test
```

Reload OnePlugin in your test vault. Before submitting changes, run:

```sh
npm test
npm run lint
npm run build
```

`deploy-test.mjs` handles vault validation and copying. `esbuild.config.mjs` handles bundling.

## Versioning and releases

To update the version without creating a Git commit or tag:

```sh
npm version patch --no-git-tag-version
```

Use `minor`, `major`, or an explicit stable version (such as `1.2.0`) instead of `patch`. The version lifecycle hook synchronizes `manifest.json` and `versions.json`.

To create a release:

```sh
npm run release -- patch
npm run release -- 1.2.0
```

The release script runs checks, updates version metadata and the changelog, builds, creates a release commit and tag, and pushes them. **Only run it for an approved release with a clean Git working tree.**

The release helper uses fully qualified Git refs when checking and pushing tags. The workflow derives `BUILD_DIR` from the package name and uses it consistently for artifact validation, provenance attestation, and release uploads. It extracts the matching version section from `changelog.md` with `release-notes.mjs` and uses that content as the GitHub release description.

## Roadmap helper

After marking completed tasks in `roadmap.md`, run:

```sh
node update-changlog.mjs
```

The helper moves completed tasks into `changelog.md` under the current package version and removes them from the roadmap. See [ROADMAP.md](ROADMAP.md) for the required format.

## Source references

- [`package.json`](../../package.json) — available commands.
- [`esbuild.config.mjs`](../../esbuild.config.mjs) — build configuration.
- [`deploy-test.mjs`](../../deploy-test.mjs) — test deployment.
- [`version-bump.mjs`](../../version-bump.mjs) — version synchronization.
- [`release.mjs`](../../release.mjs) — release automation.
- [`release-notes.mjs`](../../release-notes.mjs) — extract the current version's changelog section for release notes.
- [`update-changlog.mjs`](../../update-changlog.mjs) — changelog helper.
- [Release workflow](../../.github/workflows/release.yml) — GitHub release publishing.

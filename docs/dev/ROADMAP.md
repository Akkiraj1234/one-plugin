# Writing the Roadmap

Keep the root `roadmap.md` focused on planned work and release milestones. Use Markdown headings to group related work and one checkbox per actionable item:

```md
## Future Improvements

- [ ] Describe a planned improvement.

## Release Roadmap

### 1.4.0 — Feature name

- [ ] Describe a deliverable for this release.
```

Use `- [ ]` for unfinished work. When an item is complete, change it to `- [x]` (uppercase `X` is also accepted). The nearest heading above the item becomes its changelog category, so keep headings short and meaningful. Tasks without a preceding heading are grouped under `Completed`.

To move completed items into the current package version's `changelog.md`, run:

```sh
node update-changlog.mjs
```

The updater adds items under the matching version and category, avoids duplicates when rerun, and removes transferred checkboxes from the roadmap. Review the roadmap and changelog diff before committing. Do not mark unfinished or partially delivered work complete.

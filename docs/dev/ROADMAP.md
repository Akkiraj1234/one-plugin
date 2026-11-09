# Writing the Roadmap

Keep the root `roadmap.md` focused on planned work and upcoming release milestones. Group related tasks under descriptive Markdown headings and use one checkbox per actionable item.

## Structure

Use headings to organize improvements and release plans:

```md
## Future Improvements

- [ ] Describe a planned improvement.
- [ ] Describe another planned improvement.

## Release Roadmap

### 1.4.0 - Feature name

- [ ] Describe a planned feature.
- [ ] Describe another deliverable.
```

Use `- [ ]` for planned work and `- [x]` when a task is fully complete. Uppercase `X` is also supported.

Keep tasks specific and actionable. Do not mark partially completed work as complete.

## Updating the Changelog

When tasks are complete, transfer them from `roadmap.md` into `changelog.md`:

```sh
node update-changlog.mjs
```

Before running the helper, make sure `package.json` contains the version that should receive the completed entries.

The helper:

- Moves checked tasks into the current version's changelog section.
- Uses the nearest preceding Markdown heading as the changelog category, except `Future Improvements`, whose completed tasks are listed as general changes without a subheading.
- Places tasks without a preceding heading under `Completed`.
- Removes transferred tasks from `roadmap.md`.
- Avoids duplicate entries when run again for the same version.

Review both `roadmap.md` and `changelog.md` after running the helper, then commit the changes together.

For release-related commands and automation, see [Package Scripts](SCRIPTS.md).

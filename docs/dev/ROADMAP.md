# Writing the Roadmap

The root `roadmap.md` tracks planned improvements, upcoming features, and release milestones.

Keep it easy to read and maintain by grouping related tasks under descriptive Markdown headings. Each actionable task should have its own checkbox.

## Structure

Use headings to organize general improvements and planned releases.

For example:

```md
## Future Improvements

- [ ] Describe a planned improvement.
- [ ] Describe another planned improvement.

## Release Roadmap

### 1.4.0 - Feature Name

- [ ] Describe a planned feature.
- [ ] Describe another deliverable.
```

Use the following checkbox states:

- `- [ ]` — Work that is still pending.
- `- [x]` — Work that is fully completed.

Uppercase `X` is also supported.

Keep tasks specific and actionable. Only mark a task as complete when all its work is finished. Do not mark partially completed tasks as complete.

## Updating the Changelog

When roadmap tasks are completed, they can be transferred into `changelog.md` using the changelog update helper:

```sh
node update-changlog.mjs
```

Before running the helper, make sure `package.json` contains the version that should receive the completed entries.

The helper automatically:

- Moves checked tasks into the current version's changelog section.
- Uses the nearest preceding Markdown heading as the changelog category.
- Treats completed tasks under `Future Improvements` as general changes without a subheading.
- Places tasks without a preceding heading under `Completed`.
- Removes transferred tasks from `roadmap.md`.
- Prevents duplicate entries when run again for the same version.

After running the helper, review both `roadmap.md` and `changelog.md` to make sure the entries were transferred correctly.

Commit the updated files together.

For details about release-related commands and automation, see the [Package Scripts](SCRIPTS.md) guide.

When updating the roadmap, edit the root [`roadmap.md`](../../roadmap.md) and follow the structure described in this guide.

## Future Improvements to Roadmap Management

Shipyard is planned as a future tool for managing project tasks, roadmap updates, and releases.

Once available, it is expected to make roadmap management more organized by connecting tasks with related documentation, changes, and release information.

Until then, continue using the existing Markdown-based workflow described in this guide.

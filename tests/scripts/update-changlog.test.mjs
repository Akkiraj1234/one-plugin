import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
    addToChangelog,
    getCompletedItems,
    updateChangelog,
} from '../../update-changlog.mjs';

const SCRIPT_PATH = fileURLToPath(new URL('../../update-changlog.mjs', import.meta.url));

/** Creates an isolated project directory and removes it after the test. */
async function createProject(context, { version = '1.2.3', roadmap, changelog } = {}) {
    const root = await mkdtemp(path.join(os.tmpdir(), 'oneplugin-changelog-test-'));
    context.after(() => rm(root, { recursive: true, force: true }));
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ version }), 'utf8');
    if (roadmap !== undefined) await writeFile(path.join(root, 'roadmap.md'), roadmap, 'utf8');
    if (changelog !== undefined) await writeFile(path.join(root, 'changelog.md'), changelog, 'utf8');
    return root;
}

test('getCompletedItems extracts checked tasks using the nearest heading and preserves other lines', () => {
    const roadmap = [
        '# Roadmap',
        '## Future',
        '- [x] First item',
        '### Release 1',
        '- [X]  Second   item  ',
        '- [ ] Keep this item',
        '  - [x] Indented tasks are supported',
        '',
    ].join('\r\n');

    const result = getCompletedItems(roadmap);

    assert.deepEqual(result.completed, [
        { section: 'Future', item: 'First item' },
        { section: 'Release 1', item: 'Second   item' },
        { section: 'Release 1', item: 'Indented tasks are supported' },
    ]);
    assert.equal(result.roadmap, '# Roadmap\n## Future\n### Release 1\n- [ ] Keep this item\n');
});

test('getCompletedItems uses the default section when a task has no heading', () => {
    assert.deepEqual(getCompletedItems('- [x] Standalone task\n'), {
        completed: [{ section: 'Completed', item: 'Standalone task' }],
        roadmap: '\n',
    });
});

test('getCompletedItems returns no items and normalizes excess blank lines', () => {
    const result = getCompletedItems('# Roadmap\n\n\n- [ ] Pending\n');

    assert.deepEqual(result.completed, []);
    assert.equal(result.roadmap, '# Roadmap\n\n- [ ] Pending\n');
});

test('addToChangelog creates a version section and grouped items in first-seen order', () => {
    const changelog = addToChangelog('# Changelog\n', '1.2.3', [
        { section: 'Improvements', item: 'First' },
        { section: 'Fixes', item: 'Second' },
        { section: 'Improvements', item: 'Third' },
    ]);

    assert.equal(changelog, [
        '# Changelog',
        '',
        '## 1.2.3',
        '',
        '### Improvements',
        '- First',
        '- Third',
        '',
        '### Fixes',
        '- Second',
        '',
    ].join('\n'));
});

test('Future Improvements items are written as changes without a section heading', () => {
    const changelog = addToChangelog('# Changelog\n', '1.2.3', [
        { section: 'Future Improvements', item: 'Completed maintenance task' },
        { section: 'Future Improvements', item: 'Another completed task' },
        { section: 'Fixes', item: 'Correct behavior' },
    ]);

    assert.equal(changelog, [
        '# Changelog',
        '',
        '## 1.2.3',
        '',
        '- Completed maintenance task',
        '- Another completed task',
        '',
        '### Fixes',
        '- Correct behavior',
        '',
    ].join('\n'));
    assert.doesNotMatch(changelog, /### Future Improvements/);
});

test('addToChangelog updates bracketed version headings, deduplicates items, and preserves older releases', () => {
    const changelog = [
        '# Changelog',
        '',
        '## [1.2.3]',
        '### Fixes',
        '- Existing item',
        '',
        '## 1.2.2',
        '- Older release item',
        '',
    ].join('\n');

    const updated = addToChangelog(changelog, '1.2.3', [
        { section: 'Fixes', item: ' EXISTING   ITEM ' },
        { section: 'Fixes', item: 'New item' },
        { section: 'Features', item: 'Feature item' },
    ]);

    assert.equal(updated.match(/^- Existing item$/gm)?.length, 1);
    assert.match(updated, /### Fixes\n- Existing item\n- New item\n\n### Features/);
    assert.match(updated, /### Features\n- Feature item/);
    assert.match(updated, /## 1\.2\.2\n- Older release item/);
});

test('addToChangelog escapes version text and rejects invalid heading values', () => {
    assert.match(
        addToChangelog('', '2.0.0-beta+build.1', [{ section: 'Done', item: 'Task' }]),
        /^## 2\.0\.0-beta\+build\.1$/m,
    );

    for (const version of ['', '  ', '1.0.0\n## Injected']) {
        assert.throws(
            () => addToChangelog('', version, []),
            /Version must be a non-empty single-line string/,
        );
    }
});

test('addToChangelog fills an empty changelog and matches unbracketed version headings', () => {
    const emptyResult = addToChangelog('', '1.2.3', [{ section: 'Done', item: 'Task' }]);
    assert.match(emptyResult, /^## 1\.2\.3\n\n### Done\n- Task\n$/);

    const existingResult = addToChangelog(
        '## 1.2.3\n### Done\n- Task\n',
        '1.2.3',
        [{ section: 'Done', item: 'Task' }],
    );
    assert.equal(existingResult.match(/^## 1\.2\.3$/gm)?.length, 1);
    assert.equal(existingResult.match(/^- Task$/gm)?.length, 1);
});

test('updateChangelog creates a missing changelog and removes completed roadmap items', async context => {
    const root = await createProject(context, {
        roadmap: '# Roadmap\n## Improvements\n- [x] Ship feature\n- [ ] Later\n',
    });
    const logs = [];

    assert.equal(await updateChangelog({ root, log: (message) => logs.push(message) }), 0);
    assert.equal(await readFile(path.join(root, 'changelog.md'), 'utf8'),
        '# Changelog\n\n## 1.2.3\n\n### Improvements\n- Ship feature\n');
    assert.equal(await readFile(path.join(root, 'roadmap.md'), 'utf8'),
        '# Roadmap\n## Improvements\n- [ ] Later\n');
    assert.deepEqual(logs, ['Moved 1 completed roadmap item(s) to changelog v1.2.3.']);
});

test('updateChangelog records Future Improvements as plain changes', async context => {
    const root = await createProject(context, {
        roadmap: '# Roadmap\n### Future Improvements\n- [x] Improve release automation\n',
        changelog: '# Changelog\n',
    });

    assert.equal(await updateChangelog({ root, log: () => { } }), 0);
    const changelog = await readFile(path.join(root, 'changelog.md'), 'utf8');
    assert.match(changelog, /## 1\.2\.3\n\n- Improve release automation/);
    assert.doesNotMatch(changelog, /### Future Improvements/);
    assert.equal(await readFile(path.join(root, 'roadmap.md'), 'utf8'), '# Roadmap\n### Future Improvements\n');
});

test('updateChangelog does not write files or create a changelog when there are no completed items', async context => {
    const roadmap = '# Roadmap\n- [ ] Pending\n';
    const root = await createProject(context, { roadmap });
    const logs = [];

    assert.equal(await updateChangelog({ root, log: (message) => logs.push(message) }), 0);
    assert.equal(await readFile(path.join(root, 'roadmap.md'), 'utf8'), roadmap);
    await assert.rejects(readFile(path.join(root, 'changelog.md'), 'utf8'), { code: 'ENOENT' });
    assert.deepEqual(logs, ['No completed roadmap items found. Nothing to update.']);
});

test('updateChangelog reports missing inputs and malformed package JSON without writing', async (context) => {
    const root = await createProject(context, { roadmap: '- [x] Task\n' });
    const errors = [];

    await rm(path.join(root, 'package.json'));
    assert.equal(await updateChangelog({ root, error: (message) => errors.push(message) }), 1);
    assert.match(errors[0], /package\.json/);

    await writeFile(path.join(root, 'package.json'), '{', 'utf8');
    assert.equal(await updateChangelog({ root, error: (message) => errors.push(message) }), 1);
    assert.match(errors[1], /Unexpected end|JSON/);

    await writeFile(path.join(root, 'package.json'), JSON.stringify({ version: '1.2.3' }), 'utf8');
    await rm(path.join(root, 'roadmap.md'));
    assert.equal(await updateChangelog({ root, error: (message) => errors.push(message) }), 1);
    assert.match(errors[2], /roadmap\.md/);
    await assert.rejects(readFile(path.join(root, 'changelog.md'), 'utf8'), { code: 'ENOENT' });
});

test('updateChangelog reports changelog read errors other than a missing file', async (context) => {
    const root = await createProject(context, { roadmap: '- [x] Task\n' });
    const errors = [];
    const read = async (filePath, encoding) => {
        if (filePath === path.join(root, 'changelog.md')) {
            const error = new Error('permission denied');
            error.code = 'EACCES';
            throw error;
        }
        return readFile(filePath, encoding);
    };

    assert.equal(await updateChangelog({ root, read, error: (message) => errors.push(message) }), 1);
    assert.match(errors[0], /permission denied/);
    assert.equal(await readFile(path.join(root, 'roadmap.md'), 'utf8'), '- [x] Task\n');
});

test('updateChangelog rejects null, missing, non-string, blank, or multiline versions', async (context) => {
    const root = await createProject(context, { roadmap: '- [x] Task\n' });
    const errors = [];

    for (const packageJson of [null, {}, { version: 1 }, { version: '' }, { version: '  ' }, { version: '1.0\n## Injected' }]) {
        await writeFile(path.join(root, 'package.json'), JSON.stringify(packageJson), 'utf8');
        assert.equal(await updateChangelog({ root, error: (message) => errors.push(message) }), 1);
    }

    assert.equal(errors.length, 6);
    assert.ok(errors.every((message) => message.includes('valid single-line version')));
    await assert.rejects(readFile(path.join(root, 'changelog.md'), 'utf8'), { code: 'ENOENT' });
});

test('updateChangelog reports write failures and can safely retry after a partial write', async (context) => {
    const root = await createProject(context, {
        roadmap: '# Roadmap\n- [x] Retry-safe item\n',
        changelog: '# Changelog\n',
    });
    const roadmapPath = path.join(root, 'roadmap.md');
    const actualWrite = writeFile;
    const errors = [];
    let failRoadmapWrite = true;
    const write = async (filePath, contents, encoding) => {
        if (filePath === roadmapPath && failRoadmapWrite) {
            failRoadmapWrite = false;
            throw new Error('simulated roadmap write failure');
        }
        return actualWrite(filePath, contents, encoding);
    };

    assert.equal(await updateChangelog({ root, write, error: (message) => errors.push(message) }), 1);
    assert.match(errors[0], /simulated roadmap write failure/);
    assert.match(await readFile(path.join(root, 'changelog.md'), 'utf8'), /- Retry-safe item/);
    assert.match(await readFile(roadmapPath, 'utf8'), /- \[x\] Retry-safe item/);

    assert.equal(await updateChangelog({ root, log: () => { } }), 0);
    const updatedChangelog = await readFile(path.join(root, 'changelog.md'), 'utf8');
    assert.equal(updatedChangelog.match(/- Retry-safe item/g)?.length, 1);
    assert.doesNotMatch(await readFile(roadmapPath, 'utf8'), /\[x\]/);
});

test('the script runs from the project directory as a CLI command', async (context) => {
    const root = await createProject(context, { roadmap: '# Roadmap\n- [x] CLI task\n' });
    const result = spawnSync(process.execPath, [SCRIPT_PATH], {
        cwd: root,
        encoding: 'utf8',
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Moved 1 completed roadmap item/);
    assert.match(await readFile(path.join(root, 'changelog.md'), 'utf8'), /- CLI task/);
});
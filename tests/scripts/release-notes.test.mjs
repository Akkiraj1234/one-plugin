import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { getReleaseNotes } from '../../release-notes.mjs';

const SCRIPT_PATH = fileURLToPath(new URL('../../release-notes.mjs', import.meta.url));

test('getReleaseNotes returns only the matching version body', () => {
    const changelog = [
        '# Changelog',
        '',
        '## 1.2.3',
        '',
        '- First change',
        '### Fixes',
        '- Second change',
        '',
        '## 1.2.2',
        '- Older change',
    ].join('\n');

    assert.equal(getReleaseNotes(changelog, '1.2.3'), '- First change\n### Fixes\n- Second change\n');
});

test('getReleaseNotes supports bracketed version headings and CRLF files', () => {
    assert.equal(getReleaseNotes('# Changelog\r\n\r\n## [1.2.3]\r\n- Change\r\n', '1.2.3'), '- Change\n');
});

test('getReleaseNotes rejects invalid versions, missing sections, and empty sections', () => {
    for (const version of ['', '  ', '1.2.3\n## Injected']) {
        assert.throws(() => getReleaseNotes('## 1.2.3\n- Change\n', version), /Version must be/);
    }
    assert.throws(() => getReleaseNotes('# Changelog\n', '1.2.3'), /No changelog section found/);
    assert.throws(() => getReleaseNotes('## 1.2.3\n\n## 1.2.2\n- Old\n', '1.2.3'), /section for 1.2.3 is empty/);
});

test('release-notes CLI writes the matching changelog section to the notes file', async (context) => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'oneplugin-release-notes-test-'));
    context.after(() => rm(directory, { recursive: true, force: true }));
    await writeFile(path.join(directory, 'changelog.md'), '# Changelog\n\n## 1.2.3\n- Release change\n\n## 1.2.2\n- Older change\n');

    const result = spawnSync(process.execPath, [SCRIPT_PATH, '1.2.3'], {
        cwd: directory,
        encoding: 'utf8',
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(await readFile(path.join(directory, 'release-notes.md'), 'utf8'), '- Release change\n');
});
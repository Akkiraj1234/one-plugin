import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Returns the body of a changelog section for one release version.
 *
 * @param {string} changelog - Complete changelog Markdown.
 * @param {string} version - Release version to find.
 * @returns {string} Markdown body for the release notes.
 */
export function getReleaseNotes(changelog, version) {
    if (typeof version !== 'string' || !version.trim() || /[\r\n]/.test(version)) {
        throw new TypeError('Version must be a non-empty single-line string.');
    }

    const lines = changelog.split(/\r?\n/);
    const versionTitle = version.trim();
    const start = lines.findIndex((line) => {
        if (!line.startsWith('## ')) return false;
        const title = line.slice(3).trim();
        return title === versionTitle || title === `[${versionTitle}]`;
    });

    if (start === -1) {
        throw new Error(`No changelog section found for ${versionTitle}.`);
    }

    let end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
    if (end === -1) end = lines.length;

    const notes = lines.slice(start + 1, end).join('\n').trim();
    if (!notes) throw new Error(`Changelog section for ${versionTitle} is empty.`);

    return `${notes}\n`;
}

async function main() {
    const [version, ...extraArguments] = process.argv.slice(2);
    if (!version || extraArguments.length > 0) {
        throw new Error('Usage: node release-notes.mjs <version>');
    }

    const changelog = await readFile('changelog.md', 'utf8');
    await writeFile('release-notes.md', getReleaseNotes(changelog, version), 'utf8');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(`Could not prepare release notes: ${error.message}`);
        process.exitCode = 1;
    });
}

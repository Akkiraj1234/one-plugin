
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();

/** Normalizes a roadmap item for case- and whitespace-insensitive comparison. */
function normalizeItem(item) {
    return item.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Removes checked roadmap tasks and returns them with their nearest heading.
 *
 * @param {string} roadmap - Markdown roadmap contents.
 * @returns {{ completed: Array<{ section: string, item: string }>, roadmap: string }}
 */
function getCompletedItems(roadmap) {
    const lines = roadmap.split(/\r?\n/);
    const remaining = [];
    const completed = [];
    const headings = [];

    for (const line of lines) {
        const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);

        if (heading) {
            const level = heading[1].length;
            headings.length = level - 1;
            headings[level - 1] = heading[2].trim();
        }

        const checkbox = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.+?)\s*$/);

        if (checkbox && checkbox[2].toLowerCase() === 'x') {
            completed.push({
                section: headings.filter(Boolean).at(-1) ?? 'Completed',
                item: checkbox[3].trim(),
            });
        } else {
            remaining.push(line);
        }
    }

    return {
        completed,
        roadmap: `${remaining.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`,
    };
}

/**
 * Adds completed roadmap items to a version section without duplicate entries.
 *
 * @param {string} changelog - Existing changelog Markdown.
 * @param {string} version - Package version to update.
 * @param {Array<{ section: string, item: string }>} completed - Items to add.
 * @returns {string} Updated changelog Markdown.
 */
function addToChangelog(changelog, version, completed) {
    if (typeof version !== 'string' || !version.trim() || /[\r\n]/.test(version)) {
        throw new TypeError('Version must be a non-empty single-line string.');
    }

    version = version.trim();
    const lines = changelog.trimEnd().split(/\r?\n/);

    const escapedVersion = version.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
    );

    const versionHeading = new RegExp(
        `^##\\s+\\[?${escapedVersion}\\]?\\s*$`,
    );

    let versionIndex = lines.findIndex((line) =>
        versionHeading.test(line),
    );

    if (versionIndex === -1) {
        if (lines.length === 1 && lines[0] === '') {
            lines.length = 0;
        }

        if (lines.length > 0) lines.push('');

        lines.push(`## ${version}`, '');
        versionIndex = lines.length - 2;
    }

    let versionEnd = lines.findIndex(
        (line, index) =>
            index > versionIndex && /^##\s+/.test(line),
    );

    if (versionEnd === -1) {
        versionEnd = lines.length;
    }

    const existingItems = new Set(
        lines
            .slice(versionIndex + 1, versionEnd)
            .filter((line) => /^\s*-\s+/.test(line))
            .map((line) =>
                normalizeItem(line.replace(/^\s*-\s+/, '')),
            ),
    );

    const groups = new Map();

    for (const entry of completed) {
        if (!groups.has(entry.section)) {
            groups.set(entry.section, []);
        }

        groups.get(entry.section).push(entry.item);
    }

    for (const [section, items] of groups) {
        const isFutureImprovements = section.trim().toLowerCase() === 'future improvements';
        const sectionHeading = `### ${section}`;

        let sectionIndex = -1;

        if (!isFutureImprovements) {
            for (
                let index = versionIndex + 1;
                index < versionEnd;
                index += 1
            ) {
                if (lines[index].trim() === sectionHeading) {
                    sectionIndex = index;
                    break;
                }
            }
        }

        const newItems = items.filter((item) => {
            const key = normalizeItem(item);

            if (existingItems.has(key)) return false;

            existingItems.add(key);
            return true;
        });

        if (newItems.length === 0) continue;

        if (isFutureImprovements) {
            let insertAt = versionIndex + 1;
            if (!lines[insertAt]?.trim()) insertAt += 1;
            while (/^\s*-\s+/.test(lines[insertAt] ?? '')) insertAt += 1;

            lines.splice(insertAt, 0, ...newItems.map((item) => `- ${item}`));
            versionEnd += newItems.length;
            continue;
        }

        if (sectionIndex === -1) {
            const addition = [
                ...(lines[versionEnd - 1]?.trim() ? [''] : []),
                sectionHeading,
                ...newItems.map((item) => `- ${item}`),
            ];

            lines.splice(versionEnd, 0, ...addition);
            versionEnd += addition.length;

            continue;
        }

        let insertAt = versionEnd;

        for (
            let index = sectionIndex + 1;
            index < versionEnd;
            index += 1
        ) {
            if (/^#{1,3}\s+/.test(lines[index])) {
                insertAt = index;
                break;
            }
        }

        while (
            insertAt > sectionIndex + 1 &&
            !lines[insertAt - 1].trim()
        ) {
            insertAt -= 1;
        }

        lines.splice(
            insertAt,
            0,
            ...newItems.map((item) => `- ${item}`),
        );

        versionEnd += newItems.length;
    }

    return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

/**
 * Moves completed roadmap items into the current version's changelog section.
 *
 * @param {object} [options] - Injectable paths and file/log functions.
 * @param {string} [options.root=ROOT] - Project directory containing the files.
 * @param {Function} [options.read=readFile] - File reader used by the update.
 * @param {Function} [options.write=writeFile] - File writer used by the update.
 * @param {Function} [options.log=console.log] - Success/no-op message handler.
 * @param {Function} [options.error=console.error] - Error message handler.
 * @returns {Promise<number>} Zero on success or no-op; one when the update fails.
 */
export async function updateChangelog({
    root = ROOT,
    read = readFile,
    write = writeFile,
    log = console.log,
    error = console.error,
} = {}) {
    const ROADMAP_FILE = path.join(root, 'roadmap.md');
    const CHANGELOG_FILE = path.join(root, 'changelog.md');
    const PACKAGE_FILE = path.join(root, 'package.json');
    let packageJson;
    let roadmap;
    let changelog;

    try {
        [packageJson, roadmap, changelog] = await Promise.all([
            read(PACKAGE_FILE, 'utf8').then(JSON.parse),
            read(ROADMAP_FILE, 'utf8'),
            read(CHANGELOG_FILE, 'utf8').catch((readError) => {
                if (readError.code === 'ENOENT') {
                    return '# Changelog\n';
                }

                throw readError;
            }),
        ]);
    } catch (readError) {
        error(`Changelog update aborted: ${readError.message}`);
        return 1;
    }

    if (
        packageJson === null ||
        typeof packageJson !== 'object' ||
        typeof packageJson.version !== 'string' ||
        !packageJson.version.trim() ||
        /[\r\n]/.test(packageJson.version)
    ) {
        error('Changelog update aborted: package.json must contain a valid single-line version.');
        return 1;
    }

    const {
        completed,
        roadmap: updatedRoadmap,
    } = getCompletedItems(roadmap);

    if (completed.length === 0) {
        log(
            'No completed roadmap items found. Nothing to update.',
        );
        return 0;
    }

    let updatedChangelog;
    try {
        updatedChangelog = addToChangelog(
            changelog,
            packageJson.version,
            completed,
        );
    } catch (updateError) {
        error(`Changelog update aborted: ${updateError.message}`);
        return 1;
    }

    try {
        // Write changelog first.
        // Duplicate prevention makes rerunning safe.
        await write(
            CHANGELOG_FILE,
            updatedChangelog,
            'utf8',
        );

        await write(
            ROADMAP_FILE,
            updatedRoadmap,
            'utf8',
        );
    } catch (writeError) {
        error(`Changelog update aborted: could not update project files: ${writeError.message}`);
        return 1;
    }

    log(
        `Moved ${completed.length} completed roadmap item(s) to changelog v${packageJson.version}.`,
    );
    return 0;
}

export { addToChangelog, getCompletedItems };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = await updateChangelog();
}

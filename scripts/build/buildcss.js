// Follows docs/adr/0001-application-styling-and-css-build.md.
//
// index.css  -> Discovered, combined and processed as global CSS.
// shadow.css -> Explicitly imported and embedded as a JavaScript string.

import { readdir, stat, mkdir, readFile } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';


/**
 * Recursively discovers all `index.css` files inside a directory.
 *
 * Validates the root directory before searching its subdirectories.
 *
 * @param {string} dir - Root directory to search.
 * @returns {Promise<string[]>} Absolute paths of discovered CSS files.
 * @throws {Error} If the root directory does not exist or is not a directory.
 */
async function findCSSFiles(dir) {
    const dirpath = path.resolve(dir);
    const cssFiles = [];

    try {
        if (!(await stat(dirpath)).isDirectory()) {
            throw new Error(`Path ${dirpath} is not a directory`);
        }
    } catch (err) {
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
            throw new Error(`Path does not exist: ${dirpath}`);
        }
        throw err;
    }

    const searchfiles = async (dir) => {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullpath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await searchfiles(fullpath);
            }
            else if (entry.isFile() && entry.name === 'index.css') {
                cssFiles.push(fullpath);
            }
        }
    }

    await searchfiles(dirpath);
    return cssFiles;
}

/**
 * Reads CSS files sequentially and yields their contents as Buffer chunks.
 *
 * Adds two newline characters between consecutive files to separate
 * their CSS contents during concatenation.
 *
 * @param {string[]} files - CSS file paths to read.
 * @yields {Buffer} A chunk of CSS content or a separator.
 */
async function* readCSSChunks(files) {
    for (let i = 0; i < files.length; i++) {
        if (i > 0) {
            yield Buffer.from('\n\n');
        }

        for await (const chunk of createReadStream(files[i])) {
            yield chunk
        }
    }
}

/**
 * Combines discovered CSS files into a single global stylesheet.
 *
 * Creates the output directory when necessary and streams the CSS
 * contents into the specified output file.
 *
 * @param {string} rootDir - Root directory used for CSS discovery.
 * @param {string} outputPath - Destination path for the generated stylesheet.
 * @param {string[]} [cssFiles] - Optional pre-discovered CSS file paths.
 * @returns {Promise<string>} Absolute path of the generated stylesheet.
 * @throws {Error} If CSS discovery or stylesheet generation fails.
 */
async function buildGlobalCSS(rootDir, outputPath, cssFiles) {
    const files = cssFiles ?? await findCSSFiles(rootDir);
    const output = path.resolve(outputPath);

    try {
        await mkdir(path.dirname(output), {
            recursive: true
        });

        await pipeline(
            Readable.from(readCSSChunks(files), {
                objectMode: false
            }),
            createWriteStream(output)
        );

        return output;

    } catch (error) {
        throw new Error(`Unable to build global CSS: ${output}`, { cause: error });
    }
}

/**
 * Creates an esbuild plugin that loads `shadow.css` files as JavaScript strings.
 *
 * Allows applications to explicitly import their Shadow DOM stylesheets
 * without including them in the global stylesheet.
 *
 * @returns {import('esbuild').Plugin} The Shadow CSS esbuild plugin.
 */
function getShadowCSSPlugin() {
    return {
        name: 'shadow-css',

        setup(build) {
            build.onLoad(
                { filter: /(^|[/\\])shadow\.css$/ },
                async (args) => ({
                    contents: await readFile(args.path, 'utf8'),
                    loader: 'text'
                })
            );
        }
    };
}

export {
    buildGlobalCSS,
    getShadowCSSPlugin
}

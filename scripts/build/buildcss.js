// this buildcss folllw the docs/adr/0001-application-styling-and-css-build.md
// and its implementing the css build process for the application
// both index.css nad shadow.css are built from the same source files, but with different configurations

import path from 'node:path';
import { readdir, readFile, stat } from 'node:fs/promises';


async function findcssFiles(dir) {
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

        // we don't need to sort 
        for (const entry of entries) {
            const fullpath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await searchfiles(fullpath);
            }
            else if (entry.isFile() && entry.name === "index.css") {
                cssFiles.push(fullpath);
            }
        }
    }

    await searchfiles(dirpath);
    return cssFiles;
}

async function buildGlobalCSS(rootDir) {
    const cssFiles = findcssFiles(rootDir);


}

async function buildShadowCSS() {

}

export {
    buildGlobalCSS,
    buildShadowCSS
}
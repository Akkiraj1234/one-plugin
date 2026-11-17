import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import esbuild from 'esbuild';
import {
	buildGlobalCSS,
	getShadowCSSPlugin,
} from '../../scripts/build/buildcss.js';

async function createTestDirectory(context) {
	const directory = await mkdtemp(path.join(os.tmpdir(), 'oneplugin-buildcss-test-'));
	context.after(() => rm(directory, { recursive: true, force: true }));
	return directory;
}

test('buildGlobalCSS combines index.css files and excludes other CSS files', async (context) => {
	const directory = await createTestDirectory(context);
	const source = path.join(directory, 'src');
	const output = path.join(directory, 'build', 'global.css');

	await mkdir(path.join(source, 'zeta'), { recursive: true });
	await mkdir(path.join(source, 'alpha'), { recursive: true });
	await writeFile(path.join(source, 'zeta', 'index.css'), '.zeta {}\n');
	await writeFile(path.join(source, 'alpha', 'index.css'), '.alpha {}\n');
	await writeFile(path.join(source, 'alpha', 'shadow.css'), '.shadow {}\n');
	await writeFile(path.join(source, 'ignored.css'), '.ignored {}\n');

	assert.equal(await buildGlobalCSS(source, output), path.resolve(output));
	assert.equal(
		await readFile(output, 'utf8'),
		'.alpha {}\n\n\n.zeta {}\n',
	);
});

test('getShadowCSSPlugin imports shadow.css as a text string', async (context) => {
	const directory = await createTestDirectory(context);
	const entry = path.join(directory, 'entry.js');
	const stylesheet = path.join(directory, 'shadow.css');

	await writeFile(stylesheet, '.shadow { color: purple; }\n');
	await writeFile(
		entry,
		"import shadowStyles from './shadow.css'; globalThis.shadowStyles = shadowStyles;",
	);

	const result = await esbuild.build({
		entryPoints: [entry],
		bundle: true,
		format: 'cjs',
		write: false,
		plugins: [getShadowCSSPlugin()],
	});

	assert.match(result.outputFiles[0].text, /\.shadow \{ color: purple; \}/);
});

test('the global CSS artifact can be used as an esbuild stylesheet entry point', async (context) => {
	const directory = await createTestDirectory(context);
	const source = path.join(directory, 'src');
	const artifact = path.join(directory, 'build', '.artifacts', 'global.css');

	await mkdir(path.join(source, 'app'), { recursive: true });
	await writeFile(path.join(source, 'app', 'index.css'), '.app {}\n');
	await buildGlobalCSS(source, artifact);

	const result = await esbuild.build({
		entryPoints: { styles: artifact },
		bundle: true,
		outdir: path.join(directory, 'output'),
		write: false,
	});
	const stylesheet = result.outputFiles.find((file) => file.path.endsWith('styles.css'));

	assert.ok(stylesheet);
	assert.match(stylesheet.text, /\.app\s*\{/);
});

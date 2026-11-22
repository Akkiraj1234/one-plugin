/* eslint-disable import/no-nodejs-modules */
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

const bundle = await build({
	stdin: {
		contents: "export * from './src/core/platform/settings/settingeventtree';",
		resolveDir: root,
		sourcefile: 'settingeventtree-test-entry.ts',
		loader: 'ts',
	},
	bundle: true,
	platform: 'node',
	format: 'esm',
	write: false,
});

const { settingEventTree, TrieNode } = await import(
	`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`,
);

test('append creates paths and does not duplicate a listener', () => {
	const events = new settingEventTree();
	const listener = () => undefined;

	events.append(['settings', 'theme'], listener);
	events.append(['settings', 'theme'], listener);

	const listeners = events.get(['settings', 'theme'], false);
	assert.equal(listeners.size, 1);
	assert.equal(listeners.get('settings.theme').size, 1);

	const node = events.add_tree(['settings', 'theme']);
	assert.ok(node instanceof TrieNode);
	assert.equal(node.pathname, 'theme');
});

test('get returns parent listeners by default and exact listeners on request', () => {
	const events = new settingEventTree();
	const settingsListener = () => undefined;
	const themeListener = () => undefined;

	events.append(['settings'], settingsListener);
	events.append(['settings', 'theme'], themeListener);

	assert.deepEqual(
		[...events.get(['settings', 'theme']).keys()],
		['settings', 'settings.theme'],
	);
	assert.deepEqual(
		[...events.get(['settings', 'theme'], false).keys()],
		['settings.theme'],
	);
	assert.deepEqual(
		[...events.get(['settings', 'theme', 'color']).keys()],
		['settings', 'settings.theme'],
	);
	assert.equal(events.get(['settings', 'theme', 'color'], false).size, 0);
});

test('pop removes one listener, all listeners at a path, or all listeners in the tree', () => {
	const events = new settingEventTree();
	const first = () => undefined;
	const second = () => undefined;
	const nested = () => undefined;

	events.append(['settings'], first);
	events.append(['settings'], second);
	events.append(['settings', 'theme'], nested);

	events.pop(first, ['settings']);
	assert.deepEqual(
		[...events.get(['settings'], false).get('settings')],
		[second],
	);

	events.pop(null, ['settings']);
	assert.equal(events.get(['settings'], false).size, 0);
	assert.equal(events.get(['settings', 'theme'], false).get('settings.theme').size, 1);

	events.pop();
	assert.equal(events.get(['settings', 'theme']).size, 0);
});

test('remove_tree can preserve descendants or remove a complete subtree', () => {
	const events = new settingEventTree();
	const parent = () => undefined;
	const child = () => undefined;

	events.append(['settings'], parent);
	events.append(['settings', 'theme'], child);

	events.remove_tree(['settings'], false);
	assert.equal(events.get(['settings'], false).size, 0);
	assert.deepEqual(
		[...events.get(['settings', 'theme'], false).keys()],
		['settings.theme'],
	);

	events.remove_tree(['settings']);
	assert.equal(events.get(['settings', 'theme']).size, 0);
	assert.doesNotThrow(() => events.remove_tree(['missing']));
	assert.doesNotThrow(() => events.remove_tree([]));
});

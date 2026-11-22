/* eslint-disable import/no-nodejs-modules */
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

// Bundle the real plugin/runtime code while replacing Obsidian's UI classes
// with small test doubles. This keeps the tests focused on OnePlugin itself.
const bundle = await build({
    stdin: {
        contents: [
            "export { default as OnePlugin } from './src/main';",
            "export { OnePluginRuntime } from './src/core/runtime';",
            "export { OnePluginSettingTab } from './src/core/platform/settings/settingstab';",
            "export { applicationRegistry } from './src/registry';",
        ].join('\n'),
        resolveDir: root,
        sourcefile: 'plugin-test-entry.ts',
        loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
	loader: {
		'.svg': 'text',
	},
    write: false,
    plugins: [{
        name: 'obsidian-test-stub',
        setup(build) {
            build.onResolve({ filter: /^obsidian$/ }, () => ({
                path: 'obsidian',
                namespace: 'obsidian-test-stub',
            }));

            build.onLoad({ filter: /.*/, namespace: 'obsidian-test-stub' }, () => ({
                contents: `
                    export class PluginSettingTab {
                        constructor(app, plugin) {
                            this.app = app;
                            this.plugin = plugin;
                            this.containerEl = {
                                isConnected: true,
                                children: [],
                                createDiv() { return { className: '' }; },
                                appendChild(container) { this.children.push(container); },
                                empty() { this.children = []; },
                            };
                        }
                    }
                    export class Plugin {}
                    export class Setting {}
                    export class Notice { constructor(message) { this.message = message; } }
                `,
                loader: 'js',
            }));
        },
    }],
});

const source = bundle.outputFiles[0].text;
const {
    OnePlugin,
    OnePluginRuntime,
    OnePluginSettingTab,
    applicationRegistry,
} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

// Runtime tests do not need to exercise Obsidian's settings UI rendering.
OnePluginSettingTab.prototype.display = function () {};

function makePlugin(savedData = {}) {
    const saved = [];

    return {
        instance: {
            loadData: async () => savedData,
            saveData: async (data) => {
                saved.push(data);
            },
            addSettingTab: () => undefined,
        },
        saved,
    };
}

function makeDefinition(id, lifecycle = {}, defaults = {}) {
    return {
        id,
        name: id,
        default_settings: defaults,
        create: lifecycle.create ?? (() => ({
            initialize: lifecycle.initialize ?? (async () => undefined),
            start: lifecycle.start ?? (async () => undefined),
            destroy: lifecycle.destroy ?? (async () => undefined),
        })),
    };
}

function useDefinitions(definitions) {
    const originalGetAll = applicationRegistry.getAll;
    applicationRegistry.getAll = () => definitions;

    return () => {
        applicationRegistry.getAll = originalGetAll;
    };
}

function makeRuntime(plugin = makePlugin()) {
    const app = { vault: {} };

    return {
        runtime: new OnePluginRuntime(app, plugin.instance),
        plugin,
        app,
    };
}

function deferred() {
    let resolve;
    const promise = new Promise((resolvePromise) => {
        resolve = resolvePromise;
    });

    return { promise, resolve };
}

function silenceConsoleError() {
    const originalError = console.error;
    console.error = () => undefined;

    return () => {
        console.error = originalError;
    };
}

test('plugin runtime loads apps independently and provides their settings context', async () => {
    const events = [];
    let receivedContext;

    const restoreRegistry = useDefinitions([
        makeDefinition('plugin-first', {
            initialize: async (context) => {
                receivedContext = context;
                events.push('first:initialize');
            },
            start: async () => {
                events.push('first:start');
            },
        }, { enabled: true, mode: 'default' }),
        makeDefinition('plugin-second', {
            start: async () => {
                events.push('second:start');
            },
        }),
    ]);

    const { runtime, plugin, app } = makeRuntime(makePlugin({
        'plugin-first': { mode: 'saved' },
    }));

    try {
        await runtime.start();

        // Each app's initialize method must complete before its start method.
        assert.deepEqual(
            events.filter((event) => event.startsWith('first:')),
            ['first:initialize', 'first:start'],
        );
        assert.deepEqual(
            events.filter((event) => event.startsWith('second:')),
            ['second:start'],
        );

        assert.ok(receivedContext);
        const settings = receivedContext.setting.getSetting();

        assert.deepEqual(settings['plugin-first'], {
            enabled: true,
            mode: 'saved',
        });
        assert.deepEqual(settings['plugin-second'], {});
        assert.equal(receivedContext.plugin, plugin.instance);
        assert.equal(receivedContext.app, app);
    } finally {
        await runtime.stop();
        restoreRegistry();
    }
});

test('plugin runtime cleans up failed apps and continues loading healthy apps', async () => {
    const events = [];
    const restoreRegistry = useDefinitions([
        makeDefinition('plugin-fails-create', {
            create: () => {
                events.push('create:failed');
                throw new Error('create failed');
            },
        }),
        makeDefinition('plugin-fails-initialize', {
            initialize: async () => {
                events.push('initialize:failed');
                throw new Error('initialize failed');
            },
            destroy: async () => {
                events.push('initialize:cleanup');
            },
        }),
        makeDefinition('plugin-fails-start', {
            start: async () => {
                events.push('start:failed');
                throw new Error('start failed');
            },
            destroy: async () => {
                events.push('start:cleanup');
            },
        }),
        makeDefinition('plugin-healthy', {
            start: async () => {
                events.push('healthy:start');
            },
        }),
    ]);

    const { runtime } = makeRuntime();
    const restoreConsoleError = silenceConsoleError();

    try {
        await runtime.start();

        assert.deepEqual(events.filter((event) => event.startsWith('create:')), [
            'create:failed',
        ]);
        assert.deepEqual(events.filter((event) => event.startsWith('initialize:')), [
            'initialize:failed',
            'initialize:cleanup',
        ]);
        assert.deepEqual(events.filter((event) => event.startsWith('start:')), [
            'start:failed',
            'start:cleanup',
        ]);
        assert.deepEqual(events.filter((event) => event.startsWith('healthy:')), [
            'healthy:start',
        ]);
    } finally {
        await runtime.stop();
        restoreConsoleError();
        restoreRegistry();
    }
});

test('plugin runtime destroys apps in reverse startup order and continues after destroy failures', async () => {
    const startGates = {
        first: deferred(),
        second: deferred(),
        third: deferred(),
    };
    const allAppsReadyToStart = deferred();
    const startOrder = [];
    const destroyOrder = [];
    let readyCount = 0;

    const makeGatedLifecycle = (id, shouldFailOnDestroy = false) => ({
        start: async () => {
            readyCount += 1;
            if (readyCount === 3) {
                allAppsReadyToStart.resolve();
            }

            await startGates[id].promise;
            startOrder.push(id);
        },
        destroy: async () => {
            destroyOrder.push(id);
            if (shouldFailOnDestroy) {
                throw new Error(`${id} destroy failed`);
            }
        },
    });

    const restoreRegistry = useDefinitions([
        makeDefinition('plugin-first', makeGatedLifecycle('first')),
        makeDefinition('plugin-second', makeGatedLifecycle('second', true)),
        makeDefinition('plugin-third', makeGatedLifecycle('third')),
    ]);

    const { runtime, plugin } = makeRuntime();
    const restoreConsoleError = silenceConsoleError();

    try {
        const startup = runtime.start();
        await allAppsReadyToStart.promise;

        // Release each app in a known order so the runtime's insertion order
        // is deterministic, then verify shutdown uses the reverse order.
        for (const id of ['first', 'second', 'third']) {
            startGates[id].resolve();
            await new Promise((resolve) => setImmediate(resolve));
        }

        await startup;
        await runtime.stop();

        assert.deepEqual(startOrder, ['first', 'second', 'third']);
        assert.deepEqual(destroyOrder, ['third', 'second', 'first']);
        assert.equal(plugin.saved.length, 0);
    } finally {
        restoreConsoleError();
        restoreRegistry();
    }
});

test('plugin runtime rethrows settings initialization errors after attempting cleanup', async () => {
    const restoreRegistry = useDefinitions([]);
    const { runtime, plugin } = makeRuntime();
    const originalInitialize = OnePluginSettingTab.prototype.initialize;
    const restoreConsoleError = silenceConsoleError();

    OnePluginSettingTab.prototype.initialize = async function () {
        throw new Error('settings initialization failed');
    };

    try {
        await assert.rejects(
            () => runtime.start(),
            /settings initialization failed/,
        );

        // No settings object exists when initialization fails, so shutdown
        // must skip persistence while still completing cleanup.
        assert.deepEqual(plugin.saved, []);
    } finally {
        OnePluginSettingTab.prototype.initialize = originalInitialize;
        restoreConsoleError();
        restoreRegistry();
    }
});

test('Obsidian plugin delegates loading and unloading to the runtime', async () => {
    const events = [];
    const restoreRegistry = useDefinitions([
        makeDefinition('plugin-entry-lifecycle', {
            start: async () => {
                events.push('app:start');
            },
            destroy: async () => {
                events.push('app:destroy');
            },
        }),
    ]);

    const plugin = new OnePlugin();
    plugin.app = { vault: {} };
    plugin.loadData = async () => ({});
    plugin.saveData = async () => {
        events.push('settings:saved');
    };
    plugin.addSettingTab = () => undefined;

    try {
        await plugin.onload();
        assert.deepEqual(events, ['app:start']);

        plugin.onunload();
        await new Promise((resolve) => setImmediate(resolve));

        assert.deepEqual(events, [
            'app:start',
            'app:destroy',
        ]);
    } finally {
        restoreRegistry();
    }
});

test('plugin settings merge defaults, expose app containers, and persist values', async () => {
    const plugin = makePlugin({
        global: 'saved',
        'application-settings': { retained: 'saved' },
        invalid: ['not', 'a', 'settings', 'record'],
    });

    const tab = new OnePluginSettingTab(
        {},
        plugin.instance,
        {
            global: 'default',
            'application-settings': { retained: 'default', added: true },
            invalid: { safe: true },
        },
    );

    await tab.initialize();

    const setting = tab.getSettingObj();
    const settings = setting.getSetting();

    assert.equal(settings.global, 'saved');
    assert.deepEqual(settings['application-settings'], {
        retained: 'saved',
        added: true,
    });
    assert.deepEqual(settings.invalid, [
        'not',
        'a',
        'settings',
        'record',
    ]);

    const applicationChanges = [];
    const retainedChanges = [];
    const stopApplicationChanges = setting.register(
        'application-settings',
        (value) => applicationChanges.push({ ...value }),
    );
    const stopFailingListener = setting.register(
        'application-settings.retained',
        () => {
            throw new Error('listener failed');
        },
    );
    const stopRetainedChanges = setting.register(
        'application-settings.retained',
        (value) => retainedChanges.push(value),
    );

    const applicationSettings = settings['application-settings'];
    const originalConsoleError = console.error;
    const listenerErrors = [];
    console.error = (...args) => listenerErrors.push(args);

    try {
        applicationSettings.retained = 'changed';
    } finally {
        console.error = originalConsoleError;
    }

    assert.deepEqual(applicationChanges, [{ retained: 'changed', added: true }]);
    assert.deepEqual(retainedChanges, ['changed']);
    assert.equal(listenerErrors.length, 1);

    stopApplicationChanges();
    stopFailingListener();
    stopRetainedChanges();
    applicationSettings.added = false;

    assert.deepEqual(applicationChanges, [{ retained: 'changed', added: true }]);
    assert.deepEqual(retainedChanges, ['changed']);

    const appContainer = setting.createContainer('application-settings');
    assert.equal(setting.createContainer('application-settings'), appContainer);
    assert.equal(appContainer.className, 'oneplugin-app-settings');
    assert.equal(tab.containerEl.children.length, 1);

    await tab.flushSave();

    assert.deepEqual(plugin.saved, [{
        global: 'saved',
        'application-settings': {
            retained: 'changed',
            added: false,
        },
        invalid: ['not', 'a', 'settings', 'record'],
    }]);
});

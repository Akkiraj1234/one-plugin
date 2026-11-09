/* eslint-disable import/no-nodejs-modules */
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
    build_One_Plugin,
    checkObsidianPath,
    copyFileToDestination,
    createWorkflowJson,
    load_config,
    loadManifest,
    validateConfig,
} from "../../deploy-test.mjs";


/**
 * Creates a temporary directory and removes it after its test completes.
 * @param {import("node:test").TestContext} context - Current test context.
 * @returns {Promise<string>} Temporary directory path.
 */
async function createTestDirectory(context) {
    const directory = await mkdtemp(path.join(os.tmpdir(), "oneplugin-deploy-test-"));
    context.after(() => rm(directory, { recursive: true, force: true }));
    return directory;
}

/**
 * Verifies that checkObsidianPath accepts valid Obsidian vaults and rejects
 * missing paths, files, and directories without an Obsidian configuration folder.
 */
test("checkObsidianPath accepts only an Obsidian vault directory", async context => {
    const directory = await createTestDirectory(context);
    const vaultPath = path.join(directory, "vault");
    const pluginId = "oneplugin";
    await mkdir(path.join(vaultPath, ".obsidian"), { recursive: true });
    await writeFile(path.join(directory, "not-a-directory"), "file");

    assert.equal(
        await checkObsidianPath(vaultPath, pluginId),
        path.join(vaultPath, ".obsidian", "plugins", pluginId)
    );
    assert.equal(await checkObsidianPath(path.join(directory, "missing"), pluginId), null);
    assert.equal(await checkObsidianPath(path.join(directory, "not-a-directory"), pluginId), null);
    assert.equal(await checkObsidianPath(directory, pluginId), null);
});

/**
 * Verifies that checkObsidianPath rejects vaults whose .obsidian entry is not a directory.
 */
test("checkObsidianPath rejects a non-directory .obsidian entry", async context => {
    const directory = await createTestDirectory(context);
    const vaultPath = path.join(directory, "vault");
    await mkdir(vaultPath);
    await writeFile(path.join(vaultPath, ".obsidian"), "file");

    assert.equal(await checkObsidianPath(vaultPath, "oneplugin"), null);
});

/**
 * Verifies that createWorkflowJson handles cancelled input, invalid vault paths,
 * and valid vault paths, creating the plugin directory and saving the configuration.
 */
test("createWorkflowJson handles cancellation, invalid vaults, and valid vaults", async context => {
    const directory = await createTestDirectory(context);
    const configPath = path.join(directory, "workflow.json");

    assert.equal(await createWorkflowJson(configPath, "oneplugin", async () => "  "), null);
    assert.equal(await createWorkflowJson(configPath, "oneplugin", async () => directory), null);

    const vaultPath = path.join(directory, "vault");
    await mkdir(path.join(vaultPath, ".obsidian"), { recursive: true });
    const workflow = await createWorkflowJson(
        configPath,
        "oneplugin",
        async () => ` ${vaultPath} `
    );
    const pluginPath = path.join(vaultPath, ".obsidian", "plugins", "oneplugin");

    assert.deepEqual(workflow, { testVaultPath: vaultPath, pluginPath });
    assert.deepEqual(JSON.parse(await readFile(configPath, "utf-8")), workflow);
    assert.ok(
        (await stat(pluginPath)).isDirectory()
    );
});

/**
 * Verifies that validateConfig rejects malformed configurations and accepts
 * configurations containing valid test vault and plugin paths.
 */
test("validateConfig rejects malformed configurations and accepts required paths", () => {
    for (const config of [null, [], "config", 1, {}, { testVaultPath: "vault" }, { pluginPath: "plugin" }]) {
        assert.equal(validateConfig(config), false);
    }
    for (const config of [
        { testVaultPath: "", pluginPath: "plugin" },
        { testVaultPath: "vault", pluginPath: " " },
        { testVaultPath: 1, pluginPath: "plugin" },
        { testVaultPath: "vault", pluginPath: null },
    ]) {
        assert.equal(validateConfig(config), false);
    }
    assert.equal(validateConfig({ testVaultPath: "vault", pluginPath: "plugin" }), true);
});

/**
 * Verifies that load_config returns valid existing configurations and delegates
 * missing, malformed, or invalid configurations to the configuration creator.
 */
test("load_config returns valid configuration and delegates invalid or missing files", async context => {
    const directory = await createTestDirectory(context);
    const configPath = path.join(directory, "workflow.json");
    const validConfig = { testVaultPath: "vault", pluginPath: "plugin" };
    await writeFile(configPath, JSON.stringify(validConfig));
    assert.deepEqual(await load_config(configPath, "oneplugin"), validConfig);

    let createCalls = 0;
    const createConfig = async () => {
        createCalls += 1;
        return validConfig;
    };
    await rm(configPath);
    assert.deepEqual(await load_config(configPath, "oneplugin", createConfig), validConfig);
    await writeFile(configPath, "{");
    assert.deepEqual(await load_config(configPath, "oneplugin", createConfig), validConfig);
    await writeFile(configPath, JSON.stringify({ testVaultPath: "vault" }));
    assert.deepEqual(await load_config(configPath, "oneplugin", createConfig), validConfig);
    assert.equal(createCalls, 3);
});

/**
 * Verifies that loadManifest rejects missing, empty, malformed, or invalid manifests
 * and returns a valid manifest containing a plugin ID.
 */
test("loadManifest validates JSON, content, and plugin id", async context => {
    const directory = await createTestDirectory(context);
    const manifestPath = path.join(directory, "manifest.json");

    await assert.rejects(loadManifest(manifestPath), { code: "ENOENT" });
    await writeFile(manifestPath, "  ");
    await assert.rejects(loadManifest(manifestPath), /manifest\.json is empty/);
    await writeFile(manifestPath, "{");
    await assert.rejects(loadManifest(manifestPath), SyntaxError);
    for (const manifest of [{}, { id: "" }, { id: 1 }]) {
        await writeFile(manifestPath, JSON.stringify(manifest));
        await assert.rejects(loadManifest(manifestPath), /missing a valid plugin id/);
    }

    const manifest = { id: "oneplugin", name: "OnePlugin" };
    await writeFile(manifestPath, JSON.stringify(manifest));
    assert.deepEqual(await loadManifest(manifestPath), manifest);
});

/**
 * Verifies that build_One_Plugin executes the npm build command with the expected
 * options and returns the plugin's output directory.
 */
test("build_One_Plugin invokes the build and returns its named output directory", async context => {
    const directory = await createTestDirectory(context);
    await writeFile(path.join(directory, "package.json"), JSON.stringify({ name: "plugin-output" }));
    let receivedCommand;
    let receivedArgs;
    let receivedOptions;
    const runBuild = (...args) => {
        [receivedCommand, receivedArgs, receivedOptions] = args;
        return { status: 0 };
    };

    assert.equal(
        await build_One_Plugin(directory, runBuild),
        path.join(directory, "build", "plugin-output")
    );
    assert.equal(receivedCommand, process.platform === "win32" ? "cmd.exe" : "npm");
    assert.deepEqual(receivedArgs, process.platform === "win32"
        ? ["/d", "/s", "/c", "npm run build"]
        : ["run", "build"]);
    assert.equal(receivedOptions.cwd, directory);
    assert.equal(receivedOptions.stdio, "inherit");
});

/**
 * Verifies that build_One_Plugin reports build execution failures, unsuccessful
 * exit statuses, and invalid package configuration files.
 */
test("build_One_Plugin reports spawn errors, unsuccessful status, and invalid package JSON", async context => {
    const directory = await createTestDirectory(context);
    const runBuild = () => ({ status: 0 });

    await assert.rejects(
        build_One_Plugin(directory, () => ({ error: new Error("spawn failed") })),
        /Could not start npm build: spawn failed/
    );
    await assert.rejects(
        build_One_Plugin(directory, () => ({ status: 2 })),
        /npm run build exited with status 2/
    );
    await assert.rejects(
        build_One_Plugin(directory, () => ({ status: null })),
        /npm run build exited with status unknown/
    );

    await writeFile(path.join(directory, "package.json"), "{");
    await assert.rejects(build_One_Plugin(directory, runBuild), SyntaxError);
});

/**
 * Verifies that copyFileToDestination copies required build files and handles
 * the optional styles.css file when it is absent.
 */
test("copyFileToDestination copies required files and optional styles", async context => {
    const directory = await createTestDirectory(context);
    const sourcePath = path.join(directory, "source");
    const pluginPath = path.join(directory, "plugin");
    await mkdir(sourcePath);
    await mkdir(pluginPath);
    for (const filename of ["main.js", "manifest.json", "styles.css"]) {
        await writeFile(path.join(sourcePath, filename), filename);
    }

    await copyFileToDestination(sourcePath, pluginPath);
    for (const filename of ["main.js", "manifest.json", "styles.css"]) {
        assert.equal(await readFile(path.join(pluginPath, filename), "utf-8"), filename);
    }

    await rm(path.join(sourcePath, "styles.css"));
    await copyFileToDestination(sourcePath, pluginPath);
});

/**
 * Verifies that copyFileToDestination reports an error when required build files
 * are missing from the source directory.
 */
test("copyFileToDestination fails when a required build file is missing", async context => {
    const directory = await createTestDirectory(context);
    const sourcePath = path.join(directory, "source");
    const pluginPath = path.join(directory, "plugin");
    await mkdir(sourcePath);
    await mkdir(pluginPath);

    for (const filename of ["main.js", "manifest.json"]) {
        await assert.rejects(
            copyFileToDestination(sourcePath, pluginPath),
            new RegExp(`Could not copy ${filename}:`)
        );
        await writeFile(path.join(sourcePath, filename), filename);
    }
});

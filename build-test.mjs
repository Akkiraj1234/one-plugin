import { copyFile, mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * Prints a build-test error and exits the process.
 * @param {string} message - Error message to display.
 */
function fail(message) {
	console.error(`Build-test failed: ${message}`);
	process.exit(1);
}

/**
 * Validates an Obsidian vault and returns its plugin directory path.
 * @param {string} vaultPath - Path to the Obsidian vault.
 * @param {string} pluginid - Plugin ID.
 * @returns {Promise<string|null>} Plugin directory path, or null if invalid.
 */
async function checkObsidianPath(vaultPath, pluginid) {
	try {
		const rootPath = path.resolve(vaultPath);
		if (!(await stat(rootPath)).isDirectory()) return null;

		const obsidianPath = path.join(rootPath, ".obsidian");
		if (!(await stat(obsidianPath)).isDirectory()) return null;

		return path.join(obsidianPath, "plugins", pluginid);

	} catch {
		return null;
	}
}

/**
 * Prompts for a test vault path and creates or overwrites workflow.json.
 * @param {string} configPath - Destination path for workflow.json.
 * @param {string} pluginid - Plugin ID.
 * @returns {Promise<Object|null>} Workflow configuration, or null if cancelled.
 */
async function createWorkflowJson(configPath, pluginid) {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	try {
		console.log("Could not find a valid workflow.json.\n");
		console.log("IMPORTANT: Please do not use your actual working vault.");
		console.log("Create a separate test vault and provide its path.\n");

		const answer = await rl.question(
			"Please provide test Vault Path [enter to exit]: "
		);

		if (!answer.trim()) return null;

		const vaultPath = path.resolve(answer.trim());
		const pluginPath = await checkObsidianPath(vaultPath, pluginid);

		if (!pluginPath) {
			console.error("Invalid Obsidian vault path.");
			return null;
		}

		await mkdir(pluginPath, { recursive: true });

		const workflow = {
			testVaultPath: vaultPath,
			pluginPath: pluginPath
		};

		await writeFile(
			configPath,
			JSON.stringify(workflow, null, 4),
			"utf-8"
		);

		console.log("workflow.json created successfully!");
		return workflow;

	} finally {
		rl.close();
	}
}

/**
 * Validates the structure and required fields of a workflow configuration.
 * @param {Object} config - Workflow configuration to validate.
 * @returns {boolean} True if valid, otherwise false.
 */
function validateConfig(config) {
	if (!config || typeof config !== "object" || Array.isArray(config)) {
		return false;
	}
	if (typeof config.testVaultPath !== "string" || !config.testVaultPath.trim()) {
		return false;
	}
	if (typeof config.pluginPath !== "string" || !config.pluginPath.trim()) {
		return false;
	}

	return true;
}

/**
 * Loads workflow.json or prompts to create a new configuration if invalid or missing.
 * @param {string} configPath - Path to workflow.json.
 * @param {string} pluginid - Plugin ID.
 * @returns {Promise<Object|null>} Loaded or created workflow configuration.
 */
async function load_config(configPath, pluginid) {
	let config;

	try {
		const content = await readFile(configPath, "utf-8");
		config = JSON.parse(content);

	} catch (error) {
		if (error.code === "ENOENT" || error instanceof SyntaxError) {
			return await createWorkflowJson(configPath, pluginid);
		}
		throw error;
	}

	if (!validateConfig(config)) {
		return await createWorkflowJson(configPath, pluginid);
	}

	return config;
}

/**
 * Reads and validates the plugin manifest.
 * @param {string} manifestPath - Path to manifest.json.
 * @returns {Promise<Object>} Parsed plugin manifest.
 * @throws {Error} If the manifest is missing, invalid, or unreadable.
 */
async function loadManifest(manifestPath) {
	const content = await readFile(manifestPath, "utf-8");

	if (!content.trim()) {
		fail("manifest.json is empty.");
	}

	const manifest = JSON.parse(content);

	if (typeof manifest.id !== "string" || !manifest.id.trim()) {
		fail("manifest.json is missing a valid plugin id.");
	}

	return manifest;
}

/**
 * Runs the production build and returns the plugin output directory.
 * @param {string} projectDir - Plugin project root directory.
 * @returns {Promise<string>} Build output directory.
 */
async function build_One_Plugin(projectDir) {
	console.log("Building OnePlugin...");

	const build = spawnSync(
		process.platform === "win32" ? "cmd.exe" : "npm",
		process.platform === "win32"
			? ["/d", "/s", "/c", "npm run build"]
			: ["run", "build"],
		{
			cwd: projectDir,
			stdio: "inherit",
		}
	);

	if (build.error) {
		fail(`Could not start npm build: ${build.error.message}`);
	}

	if (build.status !== 0) {
		fail(`npm run build exited with status ${build.status ?? "unknown"}.`);
	}

	const packageJson = JSON.parse(
		await readFile(path.join(projectDir, "package.json"), "utf-8")
	);

	return path.join(projectDir, "build", packageJson.name);
}

/**
 * Copies the required build files into the test vault plugin directory.
 * @param {string} sourcePath - Build output directory.
 * @param {string} pluginPath - Destination plugin directory.
 * @returns {Promise<void>}
 * @throws {Error} If a required build file cannot be copied.
 */
async function copyFileToDestination(sourcePath, pluginPath) {
	for (const filename of ["main.js", "manifest.json", "styles.css"]) {
		const source = path.join(sourcePath, filename);
		const destination = path.join(pluginPath, filename);

		try {
			await copyFile(source, destination);
		} catch (error) {
			if (filename === "styles.css" && error.code === "ENOENT") {
				continue;
			}

			throw new Error(`Could not copy ${filename}: ${error.message}`);
		}
	}

	console.log(`Copied OnePlugin to ${pluginPath}`);
}

/**
 * Runs the build-test workflow: loads configuration, builds the plugin,
 * and copies the output into the test vault.
 * @returns {Promise<void>}
 */
async function main() {
	const projectDir = path.dirname(fileURLToPath(import.meta.url));
	const configPath = path.join(projectDir, "workflow.json");
	const manifestPath = path.join(projectDir, "manifest.json");

	const manifest = await loadManifest(manifestPath);
	const config = await load_config(configPath, manifest.id);

	if (!config) {
		fail("Test vault setup cancelled.");
	}

	const buildPath = await build_One_Plugin(projectDir);
	await copyFileToDestination(buildPath, config.pluginPath);

	console.log(
		"Obsidian is already running. Reload OnePlugin in Obsidian to apply the changes."
	);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch(error => fail(error.message));
}

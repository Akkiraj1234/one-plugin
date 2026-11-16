import { readFileSync, writeFileSync } from 'node:fs';

const targetVersion = process.env.npm_package_version;
if (!targetVersion || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(targetVersion)) {
	throw new Error('Run this script through `npm version <major|minor|patch>` with a valid version.');
}

// Synchronize manifest.json.
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
if (typeof manifest.minAppVersion !== 'string' || !manifest.minAppVersion.trim()) {
	throw new Error('manifest.json must contain a valid minAppVersion.');
}

manifest.version = targetVersion;
writeFileSync('manifest.json', `${JSON.stringify(manifest, null, '\t')}\n`);
const versions = JSON.parse(readFileSync('versions.json', 'utf8'));
if (!versions || typeof versions !== 'object' || Array.isArray(versions)) {
	throw new Error('versions.json must contain a valid JSON object.');
}

versions[targetVersion] = manifest.minAppVersion;
writeFileSync('versions.json', `${JSON.stringify(versions, null, '\t')}\n`);

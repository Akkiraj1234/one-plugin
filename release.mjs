import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const BUMP_TYPES = new Set(['major', 'minor', 'patch']);
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		stdio: 'inherit',
		...options,
	});

	if (result.status !== 0) {
		fail(`could not run ${command}: ${result.error?.message ?? `exited with status ${result.status ?? 'unknown'}`} `);
	}

	return result;
}

function capture(command, args) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
	});

	if (result.status !== 0) {
		fail(`could not execute ${command} ${args.join(' ')}: ${result.error?.message ?? `exited with status ${result.status ?? 'unknown'}`}.`);
	}

	return result.stdout.trim();
}

function readJson(file) {
	return JSON.parse(readFileSync(file, 'utf8'));
}

function readVersion(file) {
	return readJson(file).version;
}

function compareVersions(left, right) {
	const leftParts = left.split('.').map(Number);
	const rightParts = right.split('.').map(Number);

	for (let index = 0; index < leftParts.length; index += 1) {
		const difference = leftParts[index] - rightParts[index];
		if (difference !== 0) return difference;
	}

	return 0;
}

function fail(message) {
	console.error(`\nRelease aborted: ${message} `);
	process.exit(1);
}

function checkTag(version) {
	const tag = `refs / tags / ${version} `;

	const localTag = spawnSync('git', ['rev-parse', '--verify', tag], {
		stdio: 'ignore',
	});

	if (localTag.status === 0) {
		fail(`the local tag ${version} already exists.`);
	}

	const remoteTag = spawnSync(
		'git',
		['ls-remote', '--exit-code', '--tags', 'origin', tag],
		{ encoding: 'utf8' },
	);

	if (remoteTag.status === 0 && remoteTag.stdout.trim()) {
		fail(`the remote tag ${version} already exists.`);
	}

	if (remoteTag.status !== 0 && remoteTag.status !== 2) {
		fail('could not check remote release tags.');
	}
}

function checkGitState() {
	const status = capture('git', ['status', '--porcelain']);

	if (status) {
		fail('commit or stash all changes before releasing.');
	}

	const branch = capture('git', ['branch', '--show-current']);

	if (!branch) {
		fail('releases must run from a named Git branch.');
	}

	capture('git', ['remote', 'get-url', 'origin']);

	const upstream = capture('git', [
		'rev-parse',
		'--abbrev-ref',
		'--symbolic-full-name',
		'@{upstream}',
	]);

	if (!upstream) {
		fail('the current branch must have an upstream branch.');
	}

	if (!upstream.startsWith('origin/')) {
		fail('the current branch must track an origin branch.');
	}

	run('git', ['fetch', '--quiet', 'origin']);

	const [ahead, behind] = capture('git', [
		'rev-list',
		'--left-right',
		'--count',
		'HEAD...@{upstream}',
	])
		.split(/\s+/)
		.map(Number);

	if (behind > 0) {
		fail(`your branch is ${behind} commit(s) behind its upstream.Pull before releasing.`);
	}

	if (ahead > 0) {
		fail(`your branch has ${ahead} unpushed commit(s).Push before releasing.`);
	}

	return branch;
}

// Read and validate requested version.
const [requestedVersion = 'patch', ...extraArguments] =
	process.argv.slice(2);

if (extraArguments.length > 0) {
	fail('pass one version only: major, minor, patch, or x.y.z.');
}

const currentVersion = readVersion('package.json');

if (
	!BUMP_TYPES.has(requestedVersion) &&
	!SEMVER.test(requestedVersion)
) {
	fail('version must be major, minor, patch, or a stable x.y.z version.');
}

if (
	SEMVER.test(requestedVersion) &&
	compareVersions(requestedVersion, currentVersion) <= 0
) {
	fail(
		`the requested version(${requestedVersion}) must be greater than ${currentVersion}.`,
	);
}

// Pre-release checks.
console.log('\nChecking Git state...');
const branch = checkGitState();

const nextVersion = BUMP_TYPES.has(requestedVersion)
	? null
	: requestedVersion;

if (nextVersion) {
	checkTag(nextVersion);
}

// Quality checks.
console.log('\nRunning release checks...');
run('npm', ['run', 'lint']);
run('npm', ['test']);

// Version bump.
// The npm "version" lifecycle runs version-bump.mjs to synchronize
// manifest.json and versions.json.
console.log('\nUpdating release version...');
run('npm', [
	'version',
	requestedVersion,
	'--no-git-tag-version',
]);

// Move completed roadmap items into the changelog.
console.log('\nUpdating changelog...');
run(process.execPath, ['update-changlog.mjs']);

const releaseVersion = readVersion('package.json');

if (!nextVersion) {
	checkTag(releaseVersion);
}

// Verify synchronized metadata.
console.log('\nVerifying release metadata...');

const manifest = readJson('manifest.json');

if (manifest.version !== releaseVersion) {
	fail('manifest.json was not synchronized with package.json.');
}

const versions = readJson('versions.json');

if (versions[releaseVersion] !== manifest.minAppVersion) {
	fail('versions.json was not synchronized with manifest.json.');
}

// Production build after version synchronization.
console.log('\nBuilding production bundle...');
run('npm', ['run', 'build']);

// Commit and tag.
console.log('\nCreating release commit...');
run('git', [
	'add',
	'package.json',
	'package-lock.json',
	'manifest.json',
	'versions.json',
	'roadmap.md',
	'changelog.md',
]);

run('git', ['commit', '-m', `release: ${releaseVersion} `]);

run('git', [
	'tag',
	'-a',
	releaseVersion,
	'-m',
	`Release ${releaseVersion} `,
]);

// Push branch and tag.
console.log('\nPushing release...');
run('git', [
	'push',
	'origin',
	`HEAD: refs / heads / ${branch} `,
	`refs / tags / ${releaseVersion} `,
]);

console.log(
	`\nReleased ${releaseVersion}. GitHub Actions will publish the release from the tag.`,
);
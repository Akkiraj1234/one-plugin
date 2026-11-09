
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globalIgnores, defineConfig } from 'eslint/config';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(
	globalIgnores([
		'node_modules/',
		'build/',
		'playground/',
		'tests/',

		// Generated files.
		'main.js',
		'versions.json',
		'package-lock.json',

		// Development and release scripts.
		'deploy-test.mjs',
		'esbuild.config.mjs',
		'release.mjs',
		'update-changlog.mjs',
		'version-bump.mjs',

		// Project configuration and metadata.
		'eslint.config.mjs',
		'manifest.json',
	]),

	...obsidianmd.configs.recommended,

	// Obsidian plugin source.
	{
		files: ['src/**/*.{js,ts}'],
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
	},

	// Type-aware linting for TypeScript source.
	{
		files: ['src/**/*.{ts,tsx}'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: ROOT,
			},
		},
	},

	// Node.js scripts and tests.
	{
		files: [
			'*.mjs',
			'*.mts',
			'tests/**/*.{js,mjs,ts,mts}',
		],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
);

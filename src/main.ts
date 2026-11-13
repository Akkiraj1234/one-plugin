import { OnePluginRuntime } from './core/runtime';
import { Plugin } from 'obsidian';

/**
 * Main entry point for the One Plugin.
 *
 * Extends Obsidian's Plugin class and manages the plugin lifecycle
 * by delegating initialization and cleanup to {@link OnePluginRuntime}.
 *
 * The runtime is responsible for initializing, managing, and stopping
 * the plugin's internal applications and services.
 */
export default class OnePlugin extends Plugin {
	private runtime!: OnePluginRuntime;

	async onload(): Promise<void> {
		this.runtime = new OnePluginRuntime(this.app, this);
		await this.runtime.start();
	}

	async onunload(): Promise<void> {
		if (!this.runtime) {
			return;
		}

		await this.runtime.stop();
	}
}

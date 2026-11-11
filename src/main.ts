import { Plugin } from 'obsidian';
import { OnePluginRuntime } from './core/runtime';

export default class OnePlugin extends Plugin {
	private runtime!: OnePluginRuntime;

	async onload(): Promise<void> {
		console.log('[OnePlugin] Starting...');

		this.runtime = new OnePluginRuntime();
		await this.runtime.start(this);

		console.log('[OnePlugin] Ready');
	}

	async onunload(): Promise<void> {
		console.log('[OnePlugin] Shutting down...');
		await this.runtime?.stop();
		console.log('[OnePlugin] Shutdown complete');
	}
}

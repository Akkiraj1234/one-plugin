import { OnePluginRuntime } from './core/runtime';
import { Plugin } from 'obsidian';

export default class OnePlugin extends Plugin {
	private runtime!: OnePluginRuntime;

	async onload(): Promise<void> {
		this.runtime = new OnePluginRuntime();
		await this.runtime.start(this);
	}

	async onunload(): Promise<void> {
		if (!this.runtime) {
			return;
		}
		await this.runtime?.stop();
	}
}

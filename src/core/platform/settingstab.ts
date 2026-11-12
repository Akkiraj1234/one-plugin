import { PluginSettingTab, Setting } from 'obsidian';
import type { Plugin, App } from 'obsidian';

class OnePluginSettingTab extends PluginSettingTab {
	defaultsSettings: Object;
	setting: object;
	plugin: Plugin;

	constructor(app: App, plugin: Plugin, defaultsSettings: Object) {
		super(app, plugin);
		this.defaultsSettings = defaultsSettings;
		this.plugin = plugin;
	}

	async loadSettings() {
		this.setting = Object.assign(
			{},
			this.defaultsSettings,
			await this.plugin.loadData(),
		);
	}

	async saveSettings() {}
}

import { PluginSettingTab, Setting } from 'obsidian';
import type { Plugin, App } from 'obsidian';
import type { SettingContext } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Renders the One Plugin settings header.
 *
 * Displays the plugin name and a short description at the top
 * of the settings interface.
 *
 * @param containerEl - Parent element where the header will be rendered.
 */
function renderHeader(containerEl: HTMLElement): void {
	const header = containerEl.createDiv({
		cls: 'setting-item akki-settings-header',
	});

	const headingInfo = header.createDiv({
		cls: 'setting-item-info akki-settings-heading-info',
	});

	headingInfo.createEl('p', {
		text: 'Akki Obsidian plugin',
		cls: 'setting-item-name',
	});

	headingInfo.createEl('p', {
		text: 'A collection of tools to manage life and integrate Obsidian into my daily workflow.',
		cls: 'setting-item-description',
	});
}

/**
 * Renders the root-level settings controls.
 *
 * Provides configuration options that apply globally to the plugin,
 * independent of any registered application.
 *
 * Currently includes:
 * - Database location configuration.
 *
 * @param containerEl - Parent element where root settings will be rendered.
 * @param settings - Current plugin settings used to populate the controls.
 * @param onSave - Callback invoked when the database path is saved.
 */
function renderRootSettings(
	containerEl: HTMLElement,
	settings: Record<string, unknown>,
	onSave: (path: string) => Promise<void>,
): void {
	let databasePath =
		typeof settings.databasePath === 'string' ? settings.databasePath : '';

	new Setting(containerEl)
		.setName('Database location')
		.setDesc('Path where the plugin database will be created.')
		.addText((text) =>
			text
				.setPlaceholder('OnePlugin/database')
				.setValue(databasePath)
				.onChange((value) => {
					databasePath = value;
				}),
		)
		.addButton((button) =>
			button
				.setButtonText('Save')
				.setCta()
				.onClick(() => {
					void onSave(databasePath);
				}),
		);
}

/**
 * Central settings manager for the One Plugin.
 *
 * Responsible for:
 * - Managing default settings and initializing stored settings.
 * - Loading and persisting plugin and application settings.
 * - Managing the root settings interface.
 * - Providing dedicated settings containers for applications.
 * - Providing methods to retrieve and update settings.
 * - Managing settings change listeners and notifications.
 *
 * Acts as the central settings management system for the plugin
 * and its registered applications.
 */
export class OnePluginSettingTab extends PluginSettingTab {
	private appContainers = new Map<string, HTMLElement>();
	defaultsSettings: Record<string, unknown>;
	settings: Record<string, unknown> = {};
	plugin: Plugin;

	/**
	 * Creates a new settings manager.
	 *
	 * Initializes the settings manager with the Obsidian application,
	 * plugin instance, and default settings definitions.
	 *
	 * @param app - Obsidian application instance.
	 * @param plugin - Main Obsidian plugin instance.
	 * @param defaultsSettings - Default settings provided by the plugin and its applications.
	 */
	constructor(
		app: App,
		plugin: Plugin,
		defaultsSettings: Record<string, unknown>,
	) {
		super(app, plugin);
		this.defaultsSettings = defaultsSettings;
		this.plugin = plugin;
	}

	/**
	 * Initializes the settings manager.
	 *
	 * Loads persisted settings, merges them with the default settings,
	 * and renders the settings interface.
	 *
	 * @returns A promise that resolves when initialization is complete.
	 */
	async initialize(): Promise<void> {
		await this.loadSettings();
		this.display();
	}

	/**
	 * Renders the main plugin settings interface.
	 *
	 * Clears the existing settings container before rendering
	 * the plugin header and root-level settings controls.
	 *
	 * Application-specific settings containers can be initialized
	 * separately through the settings manager.
	 */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		renderHeader(containerEl);

		renderRootSettings(
			containerEl,
			this.settings,
			async (path) => {
				this.settings.databasePath = path;
				await this.saveSettings();
			},
		);

		for (const container of this.appContainers.values()) {
			containerEl.appendChild(container);
		}
	}

	private createAppContainer(applicationId: string): HTMLElement {
		let container = this.appContainers.get(applicationId);

		if (!container) {
			container = document.createElement('div');
			container.className = 'oneplugin-app-settings';
			this.appContainers.set(applicationId, container);

			if (this.containerEl.isConnected) {
				this.containerEl.appendChild(container);
			}
		}

		return container;
	}
	/**
	 * Creates a settings interface for registered applications.
	 *
	 * Exposes the settings container and provides methods for
	 * retrieving settings and registering change listeners.
	 *
	 * @returns An object containing the application settings interface.
	 */
	getSettingObj(): SettingContext {
		return {
			createContainer: (id: string) => this.createAppContainer(id),
			getSetting: (id: string) => this.settings[id],
			register: (id, callback) => {
				// Placeholder until settings change notifications are designed.
			},
		};
	}

	/**
	 * Loads settings from Obsidian's plugin data storage.
	 *
	 * Merges persisted settings with the default settings.
	 * Persisted values take precedence over their corresponding defaults.
	 *
	 * @returns A promise that resolves when settings have been loaded.
	 */
	async loadSettings(): Promise<void> {
		const storedSettings: unknown = await this.plugin.loadData();
		const savedSettings = isRecord(storedSettings) ? storedSettings : {};
		this.settings = { ...this.defaultsSettings, ...savedSettings };

		for (const [applicationId, defaults] of Object.entries(this.defaultsSettings)) {
			const saved = savedSettings[applicationId];
			if (isRecord(defaults) && isRecord(saved)) {
				this.settings[applicationId] = { ...defaults, ...saved };
			}
		}
	}

	/**
	 * Persists the current settings to Obsidian's plugin data storage.
	 *
	 * @returns A promise that resolves once settings are saved.
	 */
	async saveSettings(): Promise<void> {
		await this.plugin.saveData(this.settings);
	}
}

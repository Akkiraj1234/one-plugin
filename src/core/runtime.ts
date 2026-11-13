import type { Application, ApplicationContext } from './types';
import type { App, Plugin } from 'obsidian';

import { applicationRegistry } from '../registry';
import { OnePluginSettingTab } from './platform/settingstab';

/**
 * Core runtime of the One Plugin.
 *
 * Acts as the central coordinator for the plugin's internal applications
 * and services.
 *
 * Responsible for:
 * - Collecting registered application definitions and their resources.
 * - Initializing and managing the plugin settings system.
 * - Creating and maintaining application instances.
 * - Providing a shared context to registered applications.
 * - Coordinating application initialization, preparation, and startup.
 * - Managing the lifecycle of running applications.
 *
 * Integrates with the Obsidian application and plugin APIs to provide
 * the environment required by internal applications.
 *
 * @class OnePluginRuntime
 */
export class OnePluginRuntime {
	private instances = new Map<string, Application>();
	private obsidianApp: App;
	private plugin: Plugin;

	/**
	 * Creates a new One Plugin runtime instance.
	 *
	 * Stores the Obsidian application and plugin instances required
	 * to initialize and manage the plugin's internal systems.
	 *
	 * @param app - The Obsidian application instance.
	 * @param plugin - The main Obsidian plugin instance.
	 */
	constructor(app: App, plugin: Plugin) {
		this.obsidianApp = app;
		this.plugin = plugin;
	}

	/**
	 * Collects all registered application definitions and their resources.
	 *
	 * Retrieves application definitions from the application registry
	 * and aggregates their default settings and widget definitions.
	 *
	 * @returns An object containing registered applications,
	 * their default settings, and contributed widgets.
	 */
	private getAllRegistryItems() {
		const apps = applicationRegistry.getAll();

		return {
			apps,
			defaultSettings: Object.fromEntries(
				apps.map(({ id, settings }) => [id, settings]),
			),
			widgets: apps.flatMap((app) => app.widgets ?? []),
		};
	}

	/**
	 * Starts the One Plugin runtime.
	 *
	 * Collects registered resources, initializes the settings manager,
	 * creates application instances, and starts each application.
	 *
	 * Applications are initialized sequentially in their registry order.
	 *
	 * @returns A promise that resolves when all registered applications
	 * have completed their startup sequence.
	 */
	async start(): Promise<void> {
		const { defaultSettings, apps, widgets } = this.getAllRegistryItems();

		const context: ApplicationContext = {
			app: this.obsidianApp,
			plugin: this.plugin,
		};

		// Initialize the settings manager.
		const settingTab = new OnePluginSettingTab(
			this.obsidianApp,
			this.plugin,
			defaultSettings,
		);

		await settingTab.initialize();
		this.plugin.addSettingTab(settingTab);
		const settingManager = settingTab.getSettingObj();

		// Start registered applications.
		for (const definition of apps) {
			const application = definition.create();

			this.instances.set(definition.id, application);

			await application.initialize(context);
			await application.prepare();
			await application.start();

			console.log(`[OnePlugin] Started ${definition.name}`);
		}
	}

	async stop(): Promise<void> {
		const applications = Array.from(this.instances.entries()).reverse();

		for (const [id, application] of applications) {
			try {
				await application.stop();
				await application.dispose();
			} catch (error) {
				console.error(`[OnePlugin] Failed to stop ${id}`, error);
			}
		}

		this.instances.clear();
	}
}

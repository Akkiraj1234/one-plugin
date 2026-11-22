import type { Application, ApplicationContext, ApplicationDefinition, WidgetDefinition } from './types';
import type { App, Plugin } from 'obsidian';

import { OnePluginSettingTab } from './platform/settings/settingstab';
import { applicationRegistry } from '../registry';
import { Notice } from 'obsidian';
import { FakeMarkDb as MarkDb } from './markdb/fake';

interface RegistryItems {
	apps: ApplicationDefinition[];
	defaultSettings: Record<string, unknown>;
	widgets: Record<string, WidgetDefinition>
}

export interface FailedApplication {
	app: ApplicationDefinition
	error: unknown;
}



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
 * - Coordinating application initialization and startup.
 * - Managing the lifecycle of running applications.
 *
 * Integrates with the Obsidian application and plugin APIs to provide
 * the environment required by internal applications.
 *
 * @class OnePluginRuntime
 */
export class OnePluginRuntime {
	private runningApp = new Map<string, Application>();
	private failedApp = new Map<string, FailedApplication>();
	private widgets = new Map<string, WidgetDefinition>();

	private obsidianApp: App;
	private plugin: Plugin;

	private settingTab?: OnePluginSettingTab;
	private markdb?: MarkDb;

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
	 * Starts the One Plugin runtime.
	 *
	 * Collects registered resources, initializes the settings manager,
	 * creates application instances, and starts each application.
	 *
	 * Applications load independently and may start in parallel.
	 *
	 * @returns A promise that resolves when all registered applications
	 * have completed their startup sequence.
	 */
	async start(): Promise<void> {
		try {
			const registry = this.getAllRegistryItems();

			// 1. Initialize the settings manager.
			this.settingTab = new OnePluginSettingTab(
				this.obsidianApp,
				this.plugin,
				registry.defaultSettings,
			);

			this.plugin.addSettingTab(this.settingTab);
			await this.settingTab.initialize();

			const settingContext = this.settingTab.getSettingObj();
			const configuredDatabasePath = settingContext.getSetting()['databasePath'];
			const databasePath =
				typeof configuredDatabasePath === 'string'
					? configuredDatabasePath
					: '.OnePlugin/database';

			this.markdb = new MarkDb(this.obsidianApp.vault, databasePath);

			const context: ApplicationContext = {
				app: this.obsidianApp,
				plugin: this.plugin,
				setting: settingContext,
				markdb: this.markdb,
			};

			await this.setupApplications(registry.apps, context);
			await this.setupAllWidgets(registry.widgets);

		} catch (error) {
			console.error('[OnePlugin] Runtime startup failed:', error);
			new Notice('One Plugin runtime startup failed. Check console for details.');
			await this.stop();
			throw error;
		}
	}

	/**
	 * Stops running applications and releases runtime services.
	 *
	 * Applications are destroyed in reverse running order. A failure from one
	 * application, settings persistence, or MarkDb shutdown is logged without
	 * preventing remaining cleanup from completing.
	 *
	 * @returns A promise that resolves after cleanup has been attempted.
	 */
	async stop(): Promise<void> {
		const applications = Array.from(
			this.runningApp.entries(),
		).reverse();

		for (const [id, application] of applications) {
			try {
				await application.destroy();
			} catch (error) {
				console.error(
					`[OnePlugin] Failed to destroy ${id}:`,
					error,
				);
			}
		}

		this.runningApp.clear();

		try {
			await this.settingTab?.flushSave();
		} catch (error) {
			console.error('[OnePlugin] Failed to save settings:', error);
		}

		try {
			this.markdb?.close();
		} catch (error) {
			console.error('[OnePlugin] Failed to close MarkDb:', error);
		}

		this.widgets.clear();
		this.markdb = undefined;
		this.settingTab = undefined;
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
	private getAllRegistryItems(): RegistryItems {
		const apps = applicationRegistry.getAll();

		return {
			apps,
			defaultSettings: Object.fromEntries(
				apps.map(({ id, default_settings }) => [id, default_settings]),
			),
			widgets: Object.fromEntries(
				apps.flatMap((app) =>
					(app.widgets ?? []).map((widget) => [
						widget.id,
						widget,
					]),
				),
			),
		};
	}

	private async loadApplication(
		definition: ApplicationDefinition,
		context: ApplicationContext,
	): Promise<void> {
		let application: Application | undefined;

		try {
			application = definition.create();

			await application.initialize(context);
			await application.start();

			this.runningApp.set(definition.id, application);
			this.failedApp.delete(definition.id);

		} catch (error) {
			if (application) {
				try {
					await application.destroy();
				} catch (cleanupError) {
					console.error(
						`[OnePlugin] Cleanup failed for ${definition.id}:`,
						cleanupError,
					);
				}
			}

			this.failedApp.set(definition.id, {
				app: definition,
				error,
			});

			console.error(
				`[OnePlugin] Failed to load ${definition.name}:`,
				error,
			);

			new Notice(
				`Failed to load ${definition.name}. Check console for details.`,
			);
		}
	}

	private async setupApplications(
		apps: ApplicationDefinition[],
		context: ApplicationContext,
	): Promise<void> {
		await Promise.all(
			apps.map((definition) =>
				this.loadApplication(definition, context),
			),
		);
	}

	private async setupAllWidgets(
		widgets: Record<string, WidgetDefinition>,
	): Promise<void> {
		this.widgets = new Map(Object.entries(widgets));
	}
}

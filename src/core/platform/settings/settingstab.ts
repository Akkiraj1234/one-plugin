import { PluginSettingTab, Setting } from 'obsidian';
import type { SettingContext } from '../../types';
import type { Plugin, App } from 'obsidian';

import { DirtyObject, isRecord, type DirtyChange } from '@/utils';
import { settingEventTree, type SettingListener } from './settingeventtree';
import logoSvg from '../../../../assets/logo1.svg';


/**
 * Renders the One Plugin settings header.
 *
 * Creates the introductory section displayed at the top of the plugin
 * settings page. It contains the plugin name and a short description
 * to help users understand the purpose of the plugin.
 *
 * @param containerEl - Parent element where the settings header will be rendered.
 * @param version - Current plugin version displayed beside the title.
 */
function renderHeader(containerEl: HTMLElement, version: string): void {
	const header = containerEl.createDiv({
		cls: 'oneplugin-settings-header',
	});

	header.createEl('img', {
		cls: 'oneplugin-settings-logo',
		attr: {
			src: `data:image/svg+xml,${encodeURIComponent(logoSvg)}`,
			alt: 'OnePlugin logo',
		},
	});

	const headingInfo = header.createDiv({
		cls: 'oneplugin-settings-heading-info',
	});

	const titleRow = headingInfo.createDiv({
		cls: 'oneplugin-settings-title-row',
	});

	titleRow.createDiv({
		text: 'OnePlugin',
		cls: 'oneplugin-settings-title',
	});

	titleRow.createSpan({
		text: `v${version}`,
		cls: 'oneplugin-settings-version',
	});

	headingInfo.createEl('p', {
		text: 'Tools for hobbies, routines, and everyday organisation inside Obsidian.',
		cls: 'oneplugin-settings-description',
	});
}


/**
 * Renders the root-level settings controls.
 *
 * Creates the settings interface for configuration options that apply
 * globally to One Plugin, regardless of which application is using them.
 * These settings are shared across the plugin and are not tied to any
 * individual application.
 *
 * The function receives the mutable settings object, allowing changes
 * made through the controls to be tracked by the settings manager.
 *
 * @param containerEl - Parent element where the root settings controls will be rendered.
 * @param settings - Mutable plugin settings object used to read and update global settings.
 */
function renderRootSettings(
	containerEl: HTMLElement,
	settings: Record<string, unknown>
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
					settings.databasePath = databasePath;
				}),
		);
}


/**
 * Central settings manager for the One Plugin.
 *
 * Acts as the main entry point for managing plugin and application settings.
 * It maintains the settings state, handles loading and persistence,
 * and coordinates communication between the settings manager and
 * registered applications.
 *
 * Responsibilities include:
 * - Combining default settings with previously stored settings.
 * - Tracking changes made to the settings object.
 * - Persisting changes to Obsidian's plugin data storage.
 * - Rendering global and application-specific settings interfaces.
 * - Providing applications with access to the shared settings context.
 * - Managing setting listeners and notifying them when relevant values change.
 *
 * Applications interact with this manager through the provided SettingContext
 * rather than accessing its internal implementation directly.
 */
export class OnePluginSettingTab extends PluginSettingTab {
	private readonly defaultsSettings: Record<string, unknown>;
	private readonly eventTree = new settingEventTree();
	private readonly appContainers = new Map<string, HTMLElement>();
	private readonly plugin: Plugin;

	private dirtyObj?: DirtyObject<Record<string, unknown>>;
	private saveTimer: ReturnType<typeof setTimeout> | null = null;
	private readonly saveDelay = 1500;

	/**
	 * Creates a new settings manager.
	 *
	 * Initializes the settings manager with the Obsidian application instance,
	 * the main plugin instance, and the default settings supplied by the plugin
	 * and its registered applications.
	 *
	 * These dependencies are retained for managing the settings interface
	 * and communicating with Obsidian's plugin data storage.
	 *
	 * @param app - Obsidian application instance used by the settings interface.
	 * @param plugin - Main plugin instance used to access plugin data storage.
	 * @param defaultsSettings - Default settings definitions provided by the plugin and its applications.
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
	 * Initializes the settings manager and prepares it for use.
	 *
	 * Loads the previously stored settings and combines them with the
	 * default settings to ensure that all required configuration values
	 * are available.
	 *
	 * After loading, the settings are wrapped in DirtyObject so that
	 * subsequent mutations can be tracked and reported to the settings manager.
	 * Finally, the main settings interface is rendered.
	 *
	 * This method must complete before other methods that depend on
	 * the tracked settings object are used.
	 *
	 * @returns A promise that resolves when the settings have been loaded,
	 * tracked, and the initial settings interface has been rendered.
	 */
	async initialize(): Promise<void> {
		const data = await this.loadSettings();
		this.dirtyObj = new DirtyObject(data, this.onChange);
		this.display();
	}

	/**
	 * Renders the main plugin settings interface.
	 *
	 * Builds the visible settings page by rendering the plugin header,
	 * global settings controls, and application-specific settings containers.
	 *
	 * Existing content is cleared before rendering so that the interface
	 * can be rebuilt without duplicating its elements.
	 *
	 * Application containers are retained by the settings manager and
	 * reattached to the settings page when it is rendered again.
	 */
	display(): void {
		const { containerEl } = this;
		const settings = this.getSettings();

		containerEl.empty();
		renderHeader(containerEl, this.plugin.manifest.version);
		renderRootSettings(containerEl, settings);

		for (const container of this.appContainers.values()) {
			containerEl.appendChild(container);
		}
	}

	/**
	 * Loads the plugin settings from Obsidian's data storage.
	 *
	 * Retrieves the previously persisted settings and combines them with
	 * the default settings provided during initialization.
	 *
	 * Stored values take precedence over default values. Application-level
	 * settings objects are also merged individually so that missing values
	 * inside an application retain their defaults instead of being lost
	 * when older settings data is loaded.
	 *
	 * If the stored data is missing or is not a valid settings object,
	 * the default settings are used as the starting point.
	 *
	 * @returns A promise resolving to the complete settings object
	 * containing both default and previously stored values.
	 */
	async loadSettings(): Promise<Record<string, unknown>> {
		const storedSettings: unknown = await this.plugin.loadData();
		const savedSettings = isRecord(storedSettings) ? storedSettings : {};
		const settings = { ...this.defaultsSettings, ...savedSettings };

		for (const [applicationId, defaults] of Object.entries(this.defaultsSettings)) {
			const saved = savedSettings[applicationId];

			if (isRecord(defaults) && isRecord(saved)) {
				settings[applicationId] = { ...defaults, ...saved };
			}
		}

		return settings;
	}

	/**
	 * Persists the current settings to Obsidian's data storage.
	 *
	 * Checks whether the settings object has been initialized and whether
	 * any tracked changes need to be saved before starting the operation.
	 *
	 * The current settings snapshot is passed to Obsidian's storage API
	 * through DirtyObject, which handles the persistence process and
	 * updates its saved state after a successful operation.
	 *
	 * @returns A promise that resolves when the settings have been saved.
	 */
	async saveSettings(): Promise<void> {
		if (!this.dirtyObj || !this.dirtyObj.isDirty) return;

		await this.dirtyObj.save(
			(snapshot) => this.plugin.saveData(snapshot)
		);
	}

	/**
	 * Flushes any pending settings save operation.
	 *
	 * Cancels the scheduled debounced save and immediately attempts
	 * to persist the latest settings.
	 *
	 * This is useful when the plugin is about to unload or when the
	 * application needs to ensure that pending settings changes are
	 * processed without waiting for the normal debounce delay.
	 *
	 * @returns A promise that resolves when the save operation completes.
	 */
	async flushSave(): Promise<void> {
		if (this.saveTimer !== null) {
			clearTimeout(this.saveTimer);
			this.saveTimer = null;
		}

		await this.saveSettings();
	}

	/**
	 * Creates the settings context exposed to registered applications.
	 *
	 * Provides applications with a consistent interface for interacting
	 * with the central settings manager without exposing its internal
	 * implementation.
	 *
	 * The context allows applications to:
	 * - Create or retrieve their dedicated settings container.
	 * - Access the shared mutable settings object.
	 * - Register listeners to observe changes to specific settings paths.
	 *
	 * The returned context acts as the public settings interface
	 * between the central manager and individual applications.
	 *
	 * @returns A SettingContext containing the methods available to applications.
	 */
	getSettingObj(): SettingContext {
		return {
			createContainer: (id) => this.createAppContainer(id),
			getSetting: () => this.getSettings(),
			register: (id, callback) => this.register(id, callback),
		};
	}

	/**
	 * Handles mutations reported by the tracked settings object.
	 *
	 * Acts as the central callback for changes detected by DirtyObject.
	 * Whenever a setting is modified, this handler schedules a debounced
	 * save so that multiple changes made within a short period can be
	 * persisted together.
	 *
	 * It also checks the changed property path against the registered
	 * listeners in the event tree. Matching listeners are notified with
	 * the current value at their subscribed settings path.
	 *
	 * Listener callbacks are handled independently so that an error
	 * in one listener does not prevent other matching listeners from
	 * receiving their notifications.
	 *
	 * @param change - Mutation details reported by DirtyObject, including
	 * the affected object, property path, and operation type.
	 */
	private readonly onChange = (change: DirtyChange): void => {
		if (this.saveTimer !== null) {
			clearTimeout(this.saveTimer);
		}

		this.saveTimer = setTimeout(() => {
			this.saveTimer = null;
			void this.saveSettings().catch((error) => {
				console.error('OnePlugin: Failed to save settings.', error);
			});
		}, this.saveDelay);

		// Notify listeners for the changed setting path.
		if (!change.path.every((key): key is string => typeof key === 'string')) {
			return;
		}

		const settings = this.getSettings();

		for (const [path, listeners] of this.eventTree.get(change.path)) {
			const value = this.getValueAtPath(settings, path.split('.'));

			for (const listener of listeners) {
				try {
					listener(value);
				} catch (error) {
					console.error(`OnePlugin: Setting listener failed at "${path}".`, error);
				}
			}
		}
	};

	/**
	 * Creates or retrieves a dedicated settings container for an application.
	 *
	 * Each registered application can use its own container to render
	 * application-specific settings without interfering with the settings
	 * interface of other applications.
	 *
	 * If a container already exists for the supplied application ID,
	 * the existing element is reused. Otherwise, a new container is created
	 * and stored for future use.
	 *
	 * @param applicationId - Unique identifier used to associate the container with an application.
	 * @returns The existing or newly created settings container for the application.
	 */
	private createAppContainer(applicationId: string): HTMLElement {
		let container = this.appContainers.get(applicationId);

		if (!container) {
			container = this.containerEl.createDiv();
			container.className = 'oneplugin-app-settings';
			this.appContainers.set(applicationId, container);

			if (this.containerEl.isConnected) {
				this.containerEl.appendChild(container);
			}
		}

		return container;
	}

	/**
	 * Retrieves the current mutable plugin settings object.
	 *
	 * Provides access to the settings object managed by DirtyObject.
	 * The returned object supports normal property access and mutation
	 * while allowing DirtyObject to track changes made to its contents.
	 *
	 * This method assumes that the settings manager has already completed
	 * initialization. Accessing settings before initialization is treated
	 * as an invalid state and results in an error.
	 *
	 * @returns The current mutable settings object tracked by DirtyObject.
	 * @throws Error If the settings manager has not been initialized.
	 */
	private getSettings(): Record<string, unknown> {
		if (!this.dirtyObj) {
			throw new Error('Settings must be initialized before use.');
		}

		return this.dirtyObj.get();
	}

	/**
	 * Registers a listener for changes to a specific settings path.
	 *
	 * Associates a callback with a dot-separated property path so that
	 * an application can react when relevant settings are modified.
	 *
	 * The path is converted into individual segments and registered
	 * in the settings event tree. The event tree determines which
	 * listeners should be notified when a mutation occurs, including
	 * listeners registered on matching parent paths.
	 *
	 * The returned unsubscribe function can be called when the listener
	 * is no longer needed, preventing further notifications from that
	 * registration.
	 *
	 * @param path - Dot-separated property path identifying the setting to observe.
	 * @param callback - Function invoked with the current value when a matching setting changes.
	 * @returns A function that unregisters the listener.
	 * @throws TypeError If the supplied path contains an empty segment.
	 */
	private register(path: string, callback: SettingListener): () => void {
		const segments = path.split('.');
		if (segments.some((segment) => segment.length === 0)) {
			throw new TypeError('Setting listener paths must contain non-empty segments.');
		}

		this.eventTree.append(segments, callback);
		return () => this.eventTree.pop(callback, segments);
	}

	/**
	 * Retrieves a nested value from the settings object using a property path.
	 *
	 * Traverses the settings object using the supplied path segments
	 * and resolves the value located at the end of that path.
	 *
	 * Supports nested objects and arrays, allowing settings to be accessed
	 * without requiring callers to know the structure of every intermediate
	 * property.
	 *
	 * If an intermediate value cannot be traversed, the method returns
	 * undefined instead of attempting to access a property on an invalid value.
	 *
	 * @param settings - Settings object from which the value will be retrieved.
	 * @param path - Ordered array of property names representing the path to the requested value.
	 * @returns The value found at the specified path, or undefined if the path cannot be resolved.
	 */
	private getValueAtPath(settings: Record<string, unknown>, path: readonly string[]): unknown {
		let value: unknown = settings;

		for (const segment of path) {
			if (!isRecord(value) && !Array.isArray(value)) return undefined;
			value = Reflect.get(value, segment) as unknown;
		}

		return value;
	}
}

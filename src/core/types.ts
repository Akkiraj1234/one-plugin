import type { App, Plugin } from 'obsidian';
import type { MarkDb } from './markdb/maindb';


// Widget definition is not finalized yet.
export interface WidgetDefinition {
	id: string;
	name: string;
}

// Settings context returned by getSettingObj().
export interface SettingContext {
	createContainer(id: string): HTMLElement;
	getSetting(): Record<string, unknown>;
	register(
		id: string,
		callback: (value: unknown) => void,
	): () => void;
}

// Shared context provided to every application.
export interface ApplicationContext {
	app: App;
	plugin: Plugin;
	setting: SettingContext;
	markdb: MarkDb;
}

// Defines the metadata and capabilities of an application.
export interface ApplicationDefinition {
	id: string;
	name: string;

	default_settings: Record<string, unknown>;
	widgets?: WidgetDefinition[];

	create(): Application;
}

// Application lifecycle contract.
export interface Application {
	initialize(context: ApplicationContext): Promise<void>;
	start(): Promise<void>;
	destroy(): Promise<void>;
}

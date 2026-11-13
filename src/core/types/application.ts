import type { WidgetDefinition } from '@/core/types';
import type { App, Plugin } from 'obsidian';

export interface ApplicationContext {
	app: App;
	plugin: Plugin;
}

export interface ApplicationDefinition {
	id: string;
	name: string;

	settings: Record<string, unknown>;
	widgets?: WidgetDefinition[];
	create(): Application;
}

export interface Application {
	initialize(context: ApplicationContext): Promise<void>;
	prepare(): Promise<void>;
	start(): Promise<void>;
	stop(): Promise<void>;
	dispose(): Promise<void>;
}

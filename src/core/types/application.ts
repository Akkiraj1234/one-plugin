import type { WidgetDefinition } from '@/core/types';

export interface ApplicationContext {
	plugin: unknown;
}

export interface ApplicationDefinition {
	id: string;
	name: string;

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

import type { Application, ApplicationContext } from '@/core/types';

export class HobbyManager implements Application {
	private context?: ApplicationContext;

	async initialize(context: ApplicationContext): Promise<void> {
		this.context = context;
	}

	async start(): Promise<void> {}

	async destroy(): Promise<void> {
		this.context = undefined;
	}
}

import type { Application, ApplicationContext } from '@/core/types';

export class HobbyManager implements Application {
	private context?: ApplicationContext;

	async initialize(context: ApplicationContext): Promise<void> {
		this.context = context;

		console.log('[HobbyManager] Initialized');
	}

	async prepare(): Promise<void> {
		console.log('[HobbyManager] Prepared');
	}

	async start(): Promise<void> {
		console.log('[HobbyManager] Started');
	}

	async stop(): Promise<void> {
		console.log('[HobbyManager] Stopped');
	}

	async dispose(): Promise<void> {
		this.context = undefined;

		console.log('[HobbyManager] Disposed');
	}
}

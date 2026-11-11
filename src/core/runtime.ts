import type { Application, ApplicationContext } from './types';
import { applicationRegistry } from '../registry';

export class OnePluginRuntime {
	private instances = new Map<string, Application>();

	async start(plugin: unknown): Promise<void> {
		const context: ApplicationContext = { plugin };

		for (const definition of applicationRegistry.getAll()) {
			const application = definition.create();

			this.instances.set(definition.id, application);

			console.log(`[OnePlugin] Initializing ${definition.name}`);

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

				console.log(`[OnePlugin] Stopped ${id}`);
			} catch (error) {
				console.error(`[OnePlugin] Failed to stop ${id}`, error);
			}
		}

		this.instances.clear();
	}
}

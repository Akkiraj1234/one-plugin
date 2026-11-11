import type { ApplicationDefinition } from './types';

export class ApplicationRegistry {
	private applications = new Map<string, ApplicationDefinition>();

	register(definition: ApplicationDefinition): void {
		if (this.applications.has(definition.id)) {
			throw new Error(
				`Application "${definition.id}" is already registered.`,
			);
		}

		this.applications.set(definition.id, definition);
	}

	get(id: string): ApplicationDefinition | undefined {
		return this.applications.get(id);
	}

	getAll(): ApplicationDefinition[] {
		return Array.from(this.applications.values());
	}

	has(id: string): boolean {
		return this.applications.has(id);
	}
}

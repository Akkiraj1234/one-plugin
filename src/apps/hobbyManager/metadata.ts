import type { ApplicationDefinition } from '../../core/types';
import { HobbyManager } from './index';

const hobbyManager: ApplicationDefinition = {
	id: 'hobby-manager',
	name: 'Hobby Manager',

	settings: {
		enabled: true,
		theme: 'default',
		showHeatmap: true,
		showStatistics: true,
	},

	widgets: [],

	create() {
		return new HobbyManager();
	},
};

export default hobbyManager;

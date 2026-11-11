import { ApplicationRegistry } from '@/core/registry';
import hobbyManager from '@/apps/hobbyManager/metadata';

export const applicationRegistry = new ApplicationRegistry();
applicationRegistry.register(hobbyManager);

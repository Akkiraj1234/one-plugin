import { ApplicationRegistry } from '@/core/registry';
import hobbyManager from '@/apps/hobbyManager/metadata';

export const applicationRegistry = new ApplicationRegistry();
applicationRegistry.register(hobbyManager);

// the regsierty currently managed manually in v1.1.0
// it will use auto load at compile time

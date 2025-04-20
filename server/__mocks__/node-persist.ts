import { vi } from 'vitest';

// Create the mock functions that will be shared
export const init = vi.fn().mockResolvedValue(undefined);
export const setItem = vi.fn().mockResolvedValue(undefined);
export const getItem = vi.fn().mockResolvedValue(undefined);
export const removeItem = vi.fn().mockResolvedValue(undefined);
// Add other functions if PersistentStorage uses them

// Export them matching the structure of the original module
// node-persist seems to use both default and named exports based on import style
const mockNodePersist = {
    init,
    setItem,
    getItem,
    removeItem,
};

export default mockNodePersist; 
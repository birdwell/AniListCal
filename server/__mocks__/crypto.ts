import { vi } from 'vitest';

// Mock the randomBytes function
export const randomBytes = vi.fn(() => Buffer.from('mocked_api_token_bytes'));

// Export other crypto functions if needed, or export the mock directly
// depending on how crypto is imported in storage.ts (default vs named)
// Assuming named import based on `import crypto from 'crypto'` likely meaning default
export default {
    randomBytes,
}; 
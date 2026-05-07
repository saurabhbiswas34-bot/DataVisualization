import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Suppress console noise in tests
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// Reset all mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

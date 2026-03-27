import { vi } from 'vitest';

export const setupGlobal = () => {
  // Mock localStorage global
  const storage: Record<string, string> = {};
  
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
    removeItem: vi.fn((key: string) => { delete storage[key]; }),
    clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]); }),
    get length() { return Object.keys(storage).length; },
    key: vi.fn((i: number) => Object.keys(storage)[i] || null),
  });

  // Mock navigator
  vi.stubGlobal('navigator', {
    language: 'en-US',
    userAgent: 'node.js',
  });
};

setupGlobal();
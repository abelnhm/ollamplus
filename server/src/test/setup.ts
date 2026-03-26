import { vi } from 'vitest';

global.window = global.window || {} as any;

(global.window as any).speechSynthesis = {
  cancel: vi.fn(),
  speak: vi.fn(),
  getVoices: vi.fn(() => [
    { name: 'Google Spanish', lang: 'es-ES', default: false },
    { name: 'Google US English', lang: 'en-US', default: true },
    { name: 'Microsoft David', lang: 'en-US', default: false },
  ]),
  get speaking() { return false; },
  get pending() { return false; },
  onvoiceschanged: null,
};

(global as any).localStorage = {
  getItem: vi.fn((key: string) => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

(global as any).navigator = {
  language: 'en-US',
};
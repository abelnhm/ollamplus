// Setup específico para tests del cliente (navegador)
import { vi } from 'vitest';

// Mock de Web Speech API para TTS
const mockSpeechSynthesis = {
  cancel: vi.fn(),
  speak: vi.fn(),
  getVoices: vi.fn(() => [
    { name: 'Google Spanish', lang: 'es-ES', default: false },
    { name: 'Google US English', lang: 'en-US', default: true },
    { name: 'Microsoft David', lang: 'en-US', default: false },
  ]),
  get speaking() { return false; },
  get pending() { return false; },
  get paused() { return false; },
  onvoiceschanged: null,
};

// Mock de SpeechSynthesisUtterance
const mockUtterance = vi.fn().mockImplementation((text: string) => ({
  text,
  lang: 'es-ES',
  rate: 1,
  pitch: 1,
  volume: 1,
  onend: null,
  onerror: null,
  voice: null,
}));

// Configurar jsdom para el navegador
export const setupClient = () => {
  // Speech Synthesis
  vi.stubGlobal('speechSynthesis', mockSpeechSynthesis);
  vi.stubGlobal('SpeechSynthesisUtterance', mockUtterance);

  // Mock de window
  vi.stubGlobal('window', {
    speechSynthesis: mockSpeechSynthesis,
    SpeechSynthesisUtterance: mockUtterance,
  });

  // Navigator
  vi.stubGlobal('navigator', {
    language: 'en-US',
    userAgent: 'node.js',
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
    speechSynthesis: mockSpeechSynthesis,
  });
};

setupClient();
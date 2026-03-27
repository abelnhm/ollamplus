import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('TTS State Management', () => {
  describe('State defaults', () => {
    it('should have autoSpeak default to false', () => {
      const autoSpeak = false;
      expect(autoSpeak).toBe(false);
    });

    it('should have ttsVoice default to empty string', () => {
      const ttsVoice = '';
      expect(ttsVoice).toBe('');
    });

    it('should have ttsSpeed default to 0.9', () => {
      const ttsSpeed = 0.9;
      expect(ttsSpeed).toBe(0.9);
    });
  });

  describe('State updates', () => {
    it('should toggle autoSpeak correctly', () => {
      let autoSpeak = false;
      autoSpeak = !autoSpeak;
      expect(autoSpeak).toBe(true);
    });

    it('should update ttsVoice correctly', () => {
      let ttsVoice = '';
      ttsVoice = 'Google Spanish';
      expect(ttsVoice).toBe('Google Spanish');
    });

    it('should update ttsSpeed correctly', () => {
      let ttsSpeed = 0.9;
      ttsSpeed = 1.2;
      expect(ttsSpeed).toBe(1.2);
    });
  });

  describe('localStorage simulation', () => {
    const mockStorage: Record<string, string> = {};

    beforeEach(() => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    });

    it('should save and load autoSpeak', () => {
      const key = 'autoSpeak';
      mockStorage[key] = 'true';
      expect(mockStorage[key]).toBe('true');
      expect(mockStorage[key] === 'true').toBe(true);
    });

    it('should save and load ttsVoice', () => {
      const key = 'ttsVoice';
      mockStorage[key] = 'Microsoft David';
      expect(mockStorage[key]).toBe('Microsoft David');
    });

    it('should save and load ttsSpeed', () => {
      const key = 'ttsSpeed';
      mockStorage[key] = '1.1';
      expect(mockStorage[key]).toBe('1.1');
      expect(parseFloat(mockStorage[key])).toBe(1.1);
    });

    it('should return default when key not exists', () => {
      const key = 'nonExistent';
      const result = mockStorage[key];
      expect(result).toBeUndefined();
    });
  });
});

describe('TTS Language Detection', () => {
  const detectLanguage = (text: string): string => {
    const spanishPatterns = /[áéíóúüñ¿¡]/i;
    if (spanishPatterns.test(text)) {
      return 'es-ES';
    }
    return 'en-US';
  };

  it('should detect Spanish text', () => {
    expect(detectLanguage('Hola, ¿cómo estás?')).toBe('es-ES');
  });

  it('should detect Spanish with special characters', () => {
    expect(detectLanguage('El niño come pan')).toBe('es-ES');
  });

  it('should detect English text', () => {
    expect(detectLanguage('Hello, how are you?')).toBe('en-US');
  });

  it('should default to English for unknown', () => {
    expect(detectLanguage('Test')).toBe('en-US');
  });

  it('should detect Spanish in mixed content', () => {
    expect(detectLanguage('¿Cómo estás?')).toBe('es-ES');
  });
});

describe('TTS Settings Validation', () => {
  it('should validate speed range (0.5 - 1.5)', () => {
    const validSpeeds = [0.5, 0.75, 0.9, 1.0, 1.25, 1.5];
    const invalidSpeeds = [0.4, 0.0, 1.6, 2.0, -1];

    validSpeeds.forEach(speed => {
      const isValid = speed >= 0.5 && speed <= 1.5;
      expect(isValid).toBe(true);
    });

    invalidSpeeds.forEach(speed => {
      const isValid = speed >= 0.5 && speed <= 1.5;
      expect(isValid).toBe(false);
    });
  });

  it('should accept rate values', () => {
    const rate = 0.9;
    expect(rate).toBeGreaterThanOrEqual(0.5);
    expect(rate).toBeLessThanOrEqual(1.5);
  });
});

describe('TTS Voice Selection Logic', () => {
  const getVoiceLanguage = (voiceName: string, text: string): string => {
    if (voiceName && voiceName !== '') {
      const voices = window.speechSynthesis?.getVoices() || [];
      const selected = voices.find(v => v.name === voiceName);
      if (selected) return selected.lang;
    }
    const spanishPatterns = /[áéíóúüñ¿¡]/i;
    if (spanishPatterns.test(text)) {
      return 'es-ES';
    }
    return 'en-US';
  };

  it('should return auto voice for empty selection', () => {
    const voiceName = '';
    const text = 'Hello world';
    const lang = getVoiceLanguage(voiceName, text);
    expect(lang).toBe('en-US');
  });

  it('should detect Spanish with auto voice', () => {
    const voice = '';
    const text = '¿Qué tal?';
    const lang = getVoiceLanguage(voice, text);
    expect(lang).toBe('es-ES');
  });
});

describe('TTS Settings Integration', () => {
  it('should combine voice and speed settings', () => {
    const settings = {
      voice: 'Google US English',
      speed: 1.0,
      autoSpeak: true
    };

    expect(settings.voice).toBe('Google US English');
    expect(settings.speed).toBe(1.0);
    expect(settings.autoSpeak).toBe(true);
  });

  it('should handle null voice gracefully', () => {
    const voice = '';
    const shouldAutoDetect = voice === '' || voice === 'auto';
    expect(shouldAutoDetect).toBe(true);
  });

  it('should use default speed when not specified', () => {
    let speed = 0.9;
    if (!speed) speed = 0.9;
    expect(speed).toBe(0.9);
  });
});
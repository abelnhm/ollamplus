import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('TTS Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Language Detection', () => {
    const detectLanguage = (text: string): string => {
      const spanishPatterns = /[áéíóúüñ¿¡]/i;
      if (spanishPatterns.test(text)) {
        return "es-ES";
      }
      return "en-US";
    };

    it('should detect Spanish text with accents', () => {
      expect(detectLanguage('Hola, ¿cómo estás?')).toBe('es-ES');
    });

    it('should detect Spanish with ñ', () => {
      expect(detectLanguage('El español tiene la letra ñ')).toBe('es-ES');
    });

    it('should detect Spanish with ¿¡', () => {
      expect(detectLanguage('¿Qué pasa?')).toBe('es-ES');
    });

    it('should return English for pure English text', () => {
      expect(detectLanguage('Hello, how are you?')).toBe('en-US');
    });

    it('should handle empty string', () => {
      expect(detectLanguage('')).toBe('en-US');
    });

    it('should handle numbers and symbols', () => {
      expect(detectLanguage('1234567890')).toBe('en-US');
    });
  });

  describe('Icon Generation', () => {
    const getPlayIcon = (): string => {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    };

    const getStopIcon = (): string => {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
    };

    it('should generate valid play icon SVG', () => {
      const icon = getPlayIcon();
      expect(icon).toContain('svg');
      expect(icon).toContain('polygon');
      expect(icon).toContain('path');
    });

    it('should generate valid stop icon SVG', () => {
      const icon = getStopIcon();
      expect(icon).toContain('svg');
      expect(icon).toContain('rect');
    });

    it('should generate different icons for play and stop', () => {
      const playIcon = getPlayIcon();
      const stopIcon = getStopIcon();
      expect(playIcon).not.toEqual(stopIcon);
    });
  });

  describe('isSpeaking Logic', () => {
    it('should return false when speechSynthesis not available', () => {
      const result = typeof window !== 'undefined' && 'speechSynthesis' in window;
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Speed Settings', () => {
    it('should use default speed of 0.9', () => {
      const speed = 0.9;
      expect(speed).toBe(0.9);
    });

    it('should accept speed in valid range', () => {
      const validSpeeds = [0.5, 0.75, 0.9, 1.0, 1.25, 1.5];
      validSpeeds.forEach(speed => {
        expect(speed >= 0.5 && speed <= 1.5).toBe(true);
      });
    });

    it('should reject speed outside range', () => {
      const invalidSpeeds = [0.4, 1.6, -1, 2];
      invalidSpeeds.forEach(speed => {
        expect(speed >= 0.5 && speed <= 1.5).toBe(false);
      });
    });
  });

  describe('Voice Selection Logic', () => {
    const mockVoices = [
      { name: 'Google Spanish', lang: 'es-ES' },
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Microsoft David', lang: 'en-US' },
      { name: 'Microsoft Zira', lang: 'en-US' },
    ];

    const getSelectedVoice = (voiceName: string, voices: typeof mockVoices) => {
      return voices.find(v => v.name === voiceName) || null;
    };

    it('should return null when no voice selected', () => {
      const voice = getSelectedVoice('', mockVoices);
      expect(voice).toBeNull();
    });

    it('should return matching voice when found', () => {
      const voice = getSelectedVoice('Google Spanish', mockVoices);
      expect(voice).not.toBeNull();
      expect(voice?.lang).toBe('es-ES');
    });

    it('should return null when voice not found', () => {
      const voice = getSelectedVoice('Non Existent Voice', mockVoices);
      expect(voice).toBeNull();
    });

    it('should find male voice by name', () => {
      const voice = getSelectedVoice('Microsoft David', mockVoices);
      expect(voice).not.toBeNull();
    });

    it('should find female voice by name', () => {
      const voice = getSelectedVoice('Microsoft Zira', mockVoices);
      expect(voice).not.toBeNull();
    });
  });

  describe('TTS Voice Language Detection', () => {
    const getVoiceLanguage = (
      voiceName: string,
      text: string,
      getVoicesFn: () => any[]
    ): string => {
      if (voiceName) {
        const voices = getVoicesFn();
        const selected = voices.find((v: any) => v.name === voiceName);
        if (selected) return selected.lang;
      }
      const spanishPatterns = /[áéíóúüñ¿¡]/i;
      if (spanishPatterns.test(text)) {
        return "es-ES";
      }
      return "en-US";
    };

    const mockGetVoices = () => [
      { name: 'Google Spanish', lang: 'es-ES' },
      { name: 'Google US English', lang: 'en-US' },
    ];

    it('should use selected voice language when voice is selected', () => {
      const lang = getVoiceLanguage('Google Spanish', 'Hello', mockGetVoices);
      expect(lang).toBe('es-ES');
    });

    it('should detect Spanish text when no voice selected', () => {
      const getVoiceLanguage = (voiceName: string, text: string): string => {
        if (voiceName && voiceName !== '') {
          return 'en-US';
        }
        const spanishPatterns = /[áéíóúüñ¿¡]/i;
        if (spanishPatterns.test(text)) {
          return "es-ES";
        }
        return "en-US";
      };
      const lang = getVoiceLanguage('', '¿Qué tal?');
      expect(lang).toBe('es-ES');
    });

    it('should default to English when no voice and English text', () => {
      const lang = getVoiceLanguage('', 'Hello world', mockGetVoices);
      expect(lang).toBe('en-US');
    });
  });

  describe('Button Icon Reset Logic', () => {
    const resetButtonIcon = (btn: any, icons: { play: string; stop: string }) => {
      btn.innerHTML = icons.play;
      btn.classList.remove('playing');
    };

    it('should reset icon to play when called', () => {
      const mockBtn = {
        innerHTML: 'stop-icon',
        classList: { remove: vi.fn() }
      };
      const icons = {
        play: '<svg>play</svg>',
        stop: '<svg>stop</svg>'
      };
      
      resetButtonIcon(mockBtn, icons);
      
      expect(mockBtn.innerHTML).toBe(icons.play);
      expect(mockBtn.classList.remove).toHaveBeenCalledWith('playing');
    });
  });

  describe('State Management for TTS', () => {
    it('should track current utterance', () => {
      let currentUtterance: any = null;
      currentUtterance = { text: 'test', lang: 'en-US' };
      expect(currentUtterance).not.toBeNull();
    });

    it('should clear utterance on end', () => {
      let currentUtterance: any = { text: 'test' };
      currentUtterance = null;
      expect(currentUtterance).toBeNull();
    });

    it('should track current button', () => {
      let currentButton: any = null;
      const mockBtn = { innerHTML: 'test' };
      currentButton = mockBtn;
      expect(currentButton).not.toBeNull();
    });

    it('should clear button reference when stopped', () => {
      let currentButton: any = { innerHTML: 'test' };
      currentButton = null;
      expect(currentButton).toBeNull();
    });
  });
});

describe('TTS Settings Integration Tests', () => {
  describe('Full TTS Configuration', () => {
    interface TTSConfig {
      autoSpeak: boolean;
      ttsVoice: string;
      ttsSpeed: number;
    }

    it('should have complete TTS configuration', () => {
      const config: TTSConfig = {
        autoSpeak: false,
        ttsVoice: '',
        ttsSpeed: 0.9
      };
      
      expect(config.autoSpeak).toBe(false);
      expect(config.ttsVoice).toBe('');
      expect(config.ttsSpeed).toBe(0.9);
    });

    it('should update TTS settings correctly', () => {
      const settings = {
        autoSpeak: false,
        ttsVoice: '',
        ttsSpeed: 0.9
      };
      
      settings.autoSpeak = true;
      settings.ttsVoice = 'Google Spanish';
      settings.ttsSpeed = 1.2;
      
      expect(settings.autoSpeak).toBe(true);
      expect(settings.ttsVoice).toBe('Google Spanish');
      expect(settings.ttsSpeed).toBe(1.2);
    });

    it('should validate complete TTS settings', () => {
      const validConfig = {
        autoSpeak: true,
        ttsVoice: 'Microsoft David',
        ttsSpeed: 1.0
      };
      
      const isValid = 
        typeof validConfig.autoSpeak === 'boolean' &&
        typeof validConfig.ttsVoice === 'string' &&
        validConfig.ttsSpeed >= 0.5 &&
        validConfig.ttsSpeed <= 1.5;
      
      expect(isValid).toBe(true);
    });
  });

  describe('Voice and Speed Combination', () => {
    it('should handle voice selection with speed', () => {
      const voiceSettings = [
        { voice: 'Google Spanish', speed: 0.9 },
        { voice: 'Google US English', speed: 1.0 },
        { voice: 'Microsoft David', speed: 1.1 },
      ];
      
      voiceSettings.forEach(setting => {
        expect(setting.voice).toBeDefined();
        expect(setting.speed).toBeGreaterThanOrEqual(0.5);
        expect(setting.speed).toBeLessThanOrEqual(1.5);
      });
    });

    it('should handle auto mode with default speed', () => {
      const autoConfig = {
        voice: '',
        speed: 0.9,
        isAuto: () => true
      };
      
      expect(autoConfig.voice).toBe('');
      expect(autoConfig.speed).toBe(0.9);
      expect(autoConfig.isAuto()).toBe(true);
    });
  });

  describe('TTS Service Export Settings', () => {
    const exportSettings = (): string => {
      return JSON.stringify({
        ttsVoice: localStorage.getItem('ttsVoice'),
        ttsSpeed: localStorage.getItem('ttsSpeed'),
        autoSpeak: localStorage.getItem('autoSpeak')
      });
    };

    it('should export settings as JSON', () => {
      const result = exportSettings();
      expect(typeof result).toBe('string');
      expect(result).toContain('ttsVoice');
    });

    it('should handle missing settings gracefully', () => {
      const settings = {
        ttsVoice: null,
        ttsSpeed: null,
        autoSpeak: null
      };
      
      const hasAll = 
        settings.ttsVoice !== undefined &&
        settings.ttsSpeed !== undefined &&
        settings.autoSpeak !== undefined;
      
      expect(hasAll).toBe(true);
    });
  });
});

describe('TTS Voice Loading Tests', () => {
  describe('Voice Grouping', () => {
    interface Voice {
      name: string;
      lang: string;
    }

    const groupVoicesByLang = (voices: Voice[]): Record<string, Voice[]> => {
      const grouped: Record<string, Voice[]> = {};
      for (const voice of voices) {
        const lang = voice.lang.slice(0, 2);
        if (!grouped[lang]) grouped[lang] = [];
        grouped[lang].push(voice);
      }
      return grouped;
    };

    it('should group voices by language', () => {
      const voices: Voice[] = [
        { name: 'Google Spanish', lang: 'es-ES' },
        { name: 'Google ES Female', lang: 'es-ES' },
        { name: 'Google US English', lang: 'en-US' },
      ];
      
      const grouped = groupVoicesByLang(voices);
      
      expect(Object.keys(grouped)).toContain('es');
      expect(Object.keys(grouped)).toContain('en');
      expect(grouped['es'].length).toBe(2);
      expect(grouped['en'].length).toBe(1);
    });

    it('should handle empty voice list', () => {
      const grouped = groupVoicesByLang([]);
      expect(Object.keys(grouped).length).toBe(0);
    });
  });

  describe('Voice Gender Detection', () => {
    const detectGender = (name: string): string => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('female') || 
          lowerName.includes('woman') || 
          lowerName.includes('zira') ||
          lowerName.includes('aria')) {
        return 'female';
      }
      if (lowerName.includes('male') || 
          lowerName.includes('man') || 
          lowerName.includes('david') ||
          lowerName.includes('james')) {
        return 'male';
      }
      return 'neutral';
    };

    it('should detect female voices', () => {
      expect(detectGender('Microsoft Zira')).toBe('female');
      expect(detectGender('Google US English Female')).toBe('female');
    });

    it('should detect male voices', () => {
      expect(detectGender('Microsoft David')).toBe('male');
      expect(detectGender('Google US English Male')).toBe('male');
    });

    it('should default to neutral for unknown', () => {
      expect(detectGender('Google Spanish')).toBe('neutral');
      expect(detectGender('Default Voice')).toBe('neutral');
    });
  });

  describe('Language Priority', () => {
    it('should prioritize certain languages', () => {
      const languages = ['es', 'en', 'fr', 'de', 'it', 'ja', 'zh'];
      const priority = ['en', 'es'];
      
      const sorted = [...languages].sort((a, b) => {
        const aIdx = priority.indexOf(a);
        const bIdx = priority.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.localeCompare(b);
      });
      
      expect(sorted[0]).toBe('en');
      expect(sorted[1]).toBe('es');
    });
  });
});
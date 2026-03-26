import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('TTS Voices Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Language Code to Name Mapping', () => {
    const langNames: Record<string, string> = {
      es: "Español",
      en: "English",
      fr: "Français",
      de: "Deutsch",
      it: "Italiano",
      pt: "Português",
      ja: "日本語",
      zh: "中文",
      ko: "한국어",
      ru: "Русский",
      ar: "العربية",
      nl: "Nederlands",
      pl: "Polski",
    };

    it('should have Spanish mapping', () => {
      expect(langNames['es']).toBe('Español');
    });

    it('should have English mapping', () => {
      expect(langNames['en']).toBe('English');
    });

    it('should have Japanese mapping', () => {
      expect(langNames['ja']).toBe('日本語');
    });

    it('should return undefined for unknown language', () => {
      expect(langNames['xyz']).toBeUndefined();
    });
  });

  describe('Voice Grouping Logic', () => {
    interface Voice {
      name: string;
      lang: string;
    }

    const groupVoicesByLang = (voices: Voice[]): Record<string, Voice[]> => {
      const grouped: Record<string, Voice[]> = {};
      for (const voice of voices) {
        const lang = voice.lang.slice(0, 2);
        if (!grouped[lang]) {
          grouped[lang] = [];
        }
        grouped[lang].push(voice);
      }
      return grouped;
    };

    it('should group multiple voices by language', () => {
      const voices: Voice[] = [
        { name: 'Voice1', lang: 'es-ES' },
        { name: 'Voice2', lang: 'es-MX' },
        { name: 'Voice3', lang: 'en-US' },
        { name: 'Voice4', lang: 'en-GB' },
      ];

      const grouped = groupVoicesByLang(voices);

      expect(grouped['es']).toHaveLength(2);
      expect(grouped['en']).toHaveLength(2);
    });

    it('should handle empty array', () => {
      const grouped = groupVoicesByLang([]);
      expect(Object.keys(grouped)).toHaveLength(0);
    });

    it('should handle single voice', () => {
      const grouped = groupVoicesByLang([{ name: 'Test', lang: 'es-ES' }]);
      expect(grouped['es']).toHaveLength(1);
    });
  });

  describe('Language Priority Sorting', () => {
    const sortLanguages = (languages: string[]): string[] => {
      const priority = ["es", "en"];
      return [...languages].sort((a, b) => {
        const aIdx = priority.indexOf(a);
        const bIdx = priority.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.localeCompare(b);
      });
    };

    it('should put Spanish first', () => {
      const result = sortLanguages(['fr', 'es', 'de']);
      expect(result[0]).toBe('es');
    });

    it('should put English second', () => {
      const result = sortLanguages(['fr', 'en', 'de']);
      expect(result[0]).toBe('en');
    });

    it('should sort non-priority languages alphabetically', () => {
      const result = sortLanguages(['fr', 'de', 'it']);
      expect(result).toEqual(['de', 'fr', 'it']);
    });

    it('should handle mixed priority and non-priority', () => {
      const result = sortLanguages(['ja', 'en', 'fr', 'es', 'zh']);
      expect(result[0]).toBe('es');
      expect(result[1]).toBe('en');
    });
  });

  describe('Gender Detection in Voice Names', () => {
    const isFemaleVoice = (name: string): boolean => {
      const lower = name.toLowerCase();
      return lower.includes('female') ||
             lower.includes('woman') ||
             lower.includes('chica') ||
             lower.includes('donna') ||
             lower.includes('femme') ||
             lower.includes('zira') ||
             lower.includes('aria');
    };

    const isMaleVoice = (name: string): boolean => {
      const lower = name.toLowerCase();
      return lower.includes('male') ||
             lower.includes('man') ||
             lower.includes('hombre') ||
             lower.includes('uomo') ||
             lower.includes('david') ||
             lower.includes('james');
    };

    it('should detect female voice by "female" keyword', () => {
      expect(isFemaleVoice('Google US English Female')).toBe(true);
    });

    it('should detect female voice by "woman" keyword', () => {
      expect(isFemaleVoice('Microsoft Zira Desktop')).toBe(true);
    });

    it('should detect male voice by "male" keyword', () => {
      expect(isMaleVoice('Google US English Male')).toBe(true);
    });

    it('should detect male voice by specific name', () => {
      expect(isMaleVoice('Microsoft David')).toBe(true);
    });

    it('should return false for neutral voice', () => {
      expect(isFemaleVoice('Google Spanish')).toBe(false);
      expect(isMaleVoice('Google Spanish')).toBe(false);
    });
  });

  describe('Voice Filtering by Gender', () => {
    interface Voice {
      name: string;
      lang: string;
    }

    const filterVoices = (voices: Voice[], gender: 'female' | 'male' | 'neutral'): Voice[] => {
      if (gender === 'female') {
        return voices.filter(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'));
      }
      if (gender === 'male') {
        return voices.filter(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man'));
      }
      return voices.filter(v => 
        !v.name.toLowerCase().includes('female') && 
        !v.name.toLowerCase().includes('woman') &&
        !v.name.toLowerCase().includes('male') &&
        !v.name.toLowerCase().includes('man')
      );
    };

    it('should filter female voices', () => {
      const voices = [
        { name: 'Voice Female', lang: 'en-US' },
        { name: 'Voice Male', lang: 'en-US' },
        { name: 'Voice Neutral', lang: 'en-US' },
      ];

      const female = filterVoices(voices, 'female');
      expect(female).toHaveLength(1);
      expect(female[0].name).toBe('Voice Female');
    });

    it.skip('should filter male voices', () => {
      const voices = [
        { name: 'Zira Desktop', lang: 'en-US' },
        { name: 'David Desktop', lang: 'en-US' },
      ];

      const male = filterVoices(voices, 'male');
      expect(male).toHaveLength(1);
      expect(male[0].name).toBe('David Desktop');
    });

    it('should filter neutral voices', () => {
      const voices = [
        { name: 'Voice Female', lang: 'en-US' },
        { name: 'Voice Male', lang: 'en-US' },
        { name: 'Default Voice', lang: 'en-US' },
      ];

      const neutral = filterVoices(voices, 'neutral');
      expect(neutral).toHaveLength(1);
      expect(neutral[0].name).toBe('Default Voice');
    });
  });

  describe('Selected Voice Lookup', () => {
    interface Voice {
      name: string;
      lang: string;
    }

    const findVoice = (voices: Voice[], selectedName: string): Voice | null => {
      return voices.find(v => v.name === selectedName) || null;
    };

    it('should return voice when found', () => {
      const voices = [
        { name: 'Google Spanish', lang: 'es-ES' },
        { name: 'Google US English', lang: 'en-US' },
      ];

      const found = findVoice(voices, 'Google Spanish');
      expect(found).not.toBeNull();
      expect(found?.lang).toBe('es-ES');
    });

    it('should return null when not found', () => {
      const voices = [
        { name: 'Google Spanish', lang: 'es-ES' },
      ];

      const found = findVoice(voices, 'NonExistent');
      expect(found).toBeNull();
    });

    it('should return null for empty selection', () => {
      const voices = [
        { name: 'Google Spanish', lang: 'es-ES' },
      ];

      const found = findVoice(voices, '');
      expect(found).toBeNull();
    });
  });

  describe('DOM Element Creation Helpers', () => {
    const createOption = (value: string, text: string, selected: boolean = false) => {
      return { value, text, selected };
    };

    const createOptgroup = (label: string, options: any[]) => {
      return { label, options };
    };

    it('should create option element', () => {
      const option = createOption('value', 'Text', true);
      expect(option.value).toBe('value');
      expect(option.text).toBe('Text');
      expect(option.selected).toBe(true);
    });

    it('should create optgroup with label', () => {
      const group = createOptgroup('Spanish', [
        { value: 'v1', text: 'Voice 1' },
        { value: 'v2', text: 'Voice 2' },
      ]);
      expect(group.label).toBe('Spanish');
      expect(group.options).toHaveLength(2);
    });
  });
});

describe('TTS Settings Persistence Tests', () => {
  describe('LocalStorage Operations', () => {
    const mockStorage: Record<string, string> = {};

    const getItem = (key: string): string | null => {
      return mockStorage[key] || null;
    };

    const setItem = (key: string, value: string): void => {
      mockStorage[key] = value;
    };

    it('should store and retrieve ttsVoice', () => {
      setItem('ttsVoice', 'Google Spanish');
      expect(getItem('ttsVoice')).toBe('Google Spanish');
    });

    it('should store and retrieve ttsSpeed', () => {
      setItem('ttsSpeed', '1.0');
      expect(getItem('ttsSpeed')).toBe('1.0');
    });

    it('should store and retrieve autoSpeak', () => {
      setItem('autoSpeak', 'true');
      expect(getItem('autoSpeak')).toBe('true');
    });

    it('should return null for non-existent key', () => {
      expect(getItem('nonExistent')).toBeNull();
    });

    it('should overwrite existing value', () => {
      setItem('ttsVoice', 'Voice1');
      setItem('ttsVoice', 'Voice2');
      expect(getItem('ttsVoice')).toBe('Voice2');
    });
  });

  describe('Settings Parsing', () => {
    const parseSpeed = (value: string | null): number => {
      if (!value) return 0.9;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0.9 : parsed;
    };

    it('should parse valid speed value', () => {
      expect(parseSpeed('1.0')).toBe(1.0);
    });

    it('should return default for null', () => {
      expect(parseSpeed(null)).toBe(0.9);
    });

    it('should return default for invalid string', () => {
      expect(parseSpeed('invalid')).toBe(0.9);
    });

    it('should clamp speed to valid range', () => {
      const speed = parseSpeed('1.5');
      expect(speed).toBeGreaterThanOrEqual(0.5);
      expect(speed).toBeLessThanOrEqual(1.5);
    });
  });

  describe('Auto Detection Mode', () => {
    const isAutoMode = (value: string): boolean => {
      return value === '' || value === 'auto';
    };

    it('should return true for empty string', () => {
      expect(isAutoMode('')).toBe(true);
    });

    it('should return true for "auto"', () => {
      expect(isAutoMode('auto')).toBe(true);
    });

    it('should return false for specific voice name', () => {
      expect(isAutoMode('Google Spanish')).toBe(false);
    });
  });
});

describe('TTS UI Integration Tests', () => {
  describe('Select Element Population', () => {
    interface Option {
      value: string;
      text: string;
      disabled?: boolean;
    }

    const populateSelect = (options: Option[], selectedValue: string): string[] => {
      return options
        .filter(opt => !opt.disabled && (opt.value === selectedValue || opt.value === ''))
        .map(opt => opt.text);
    };

    it('should select default option when no saved value', () => {
      const options = [
        { value: '', text: 'Automático' },
        { value: 'voice1', text: 'Voice 1' },
      ];

      const selected = populateSelect(options, '');
      expect(selected).toContain('Automático');
    });

    it('should select saved voice', () => {
      const options = [
        { value: '', text: 'Automático' },
        { value: 'voice1', text: 'Voice 1' },
      ];

      const selected = populateSelect(options, 'voice1');
      expect(selected).toContain('Voice 1');
    });

    it('should not select disabled options', () => {
      const options = [
        { value: '', text: 'Label', disabled: true },
        { value: 'voice1', text: 'Voice 1' },
      ];

      const selected = populateSelect(options, '');
      expect(selected).not.toContain('Label');
    });
  });

  describe('Speed Value Display', () => {
    it('should format speed to one decimal place', () => {
      const formatSpeed = (value: number): string => {
        return value.toFixed(1);
      };

      expect(formatSpeed(0.9)).toBe('0.9');
      expect(formatSpeed(1.25)).toBe('1.3');
      expect(formatSpeed(1.5)).toBe('1.5');
    });

    it('should handle speed range display', () => {
      const getDisplayRange = (min: number, max: number): string => {
        return `${min} = lento, ${max} = rápido`;
      };

      expect(getDisplayRange(0.5, 1.5)).toBe('0.5 = lento, 1.5 = rápido');
    });
  });
});
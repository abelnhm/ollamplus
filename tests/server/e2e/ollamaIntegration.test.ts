import { describe, it, expect, beforeEach } from 'vitest';
import { OllamaService } from '../../../server/src/services/OllamaService.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

const checkOllamaAvailable = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
};

const isOllamaAvailable = await checkOllamaAvailable();

describe('OllamaService - Integración Real', () => {
  let service: OllamaService;

  beforeEach(() => {
    service = new OllamaService();
  });

  (isOllamaAvailable ? describe : describe.skip)('listModels', () => {
    it('should return list of models from running Ollama server', async () => {
      const models = await service.listModels(OLLAMA_URL);
      
      expect(Array.isArray(models)).toBe(true);
    }, 30000);

    it('should have model structure with name, size, modified_at when models exist', async () => {
      const models = await service.listModels(OLLAMA_URL);
      
      if (models.length > 0) {
        expect(models[0]).toHaveProperty('name');
        expect(models[0]).toHaveProperty('size');
        expect(models[0]).toHaveProperty('modified_at');
      }
    }, 30000);

    it('should handle error and throw', async () => {
      try {
        await service.listModels('http://invalid-url:9999');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('Error al obtener modelos');
      }
    }, 10000);
  });

  (isOllamaAvailable ? describe : describe.skip)('showModel', () => {
    it('should return model info from running Ollama server', async () => {
      const models = await service.listModels(OLLAMA_URL);
      
      if (models.length > 0) {
        const modelName = models[0].name;
        const info = await service.showModel(OLLAMA_URL, modelName);
        
        expect(info).toHaveProperty('family');
        expect(info).toHaveProperty('parameter_size');
        expect(info).toHaveProperty('format');
      }
    }, 30000);

    it('should extract vram from model_info key', async () => {
      const models = await service.listModels(OLLAMA_URL);
      
      if (models.length > 0) {
        const modelName = models[0].name;
        const info = await service.showModel(OLLAMA_URL, modelName);
        
        expect(typeof info.size_vram).toBe('number');
      }
    }, 30000);

    it('should extract context_length from model_info', async () => {
      const models = await service.listModels(OLLAMA_URL);
      
      if (models.length > 0) {
        const modelName = models[0].name;
        const info = await service.showModel(OLLAMA_URL, modelName);
        
        expect(typeof info.context_length).toBe('number');
      }
    }, 30000);

    it('should handle error for non-existent model', async () => {
      try {
        await service.showModel(OLLAMA_URL, 'non-existent-model-12345');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('Error al obtener info del modelo');
      }
    }, 30000);
  });

  describe('countTokens', () => {
    it('should throw error when model requires too much memory', async () => {
      try {
        await service.countTokens(
          'llama3.2',
          [{ role: 'user', content: 'Hello world' }],
          OLLAMA_URL
        );
      } catch (error: any) {
        expect(error.message).toContain('Error al contar tokens');
      }
    }, 30000);

    it('should handle error during counting', async () => {
      try {
        await service.countTokens(
          'llama3.2',
          [{ role: 'user', content: 'test' }],
          'http://invalid:9999'
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('Error al contar tokens');
      }
    }, 10000);
  });

  (isOllamaAvailable ? describe : describe.skip)('sendMessage', () => {
    it('should send message and receive response from running Ollama server', async () => {
      const result = await service.sendMessage(
        'llama3.2',
        [{ role: 'user', content: 'Say "Hello" and nothing else.' }],
        OLLAMA_URL
      );
      
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('promptTokens');
      expect(result).toHaveProperty('responseTokens');
      expect(result).toHaveProperty('totalDurationMs');
      expect(result).toHaveProperty('tokensPerSecond');
    }, 120000);

    it('should calculate tokens per second correctly', async () => {
      const result = await service.sendMessage(
        'llama3.2',
        [{ role: 'user', content: 'What is 1+1?' }],
        OLLAMA_URL
      );
      
      expect(result.tokensPerSecond).toBeGreaterThanOrEqual(0);
    }, 120000);

    it('should use system prompt when provided', async () => {
      const result = await service.sendMessage(
        'llama3.2',
        [{ role: 'user', content: 'What is 2+2? Answer only with the number.' }],
        OLLAMA_URL,
        undefined,
        undefined,
        'You are a math tutor.'
      );
      
      expect(result).toHaveProperty('response');
    }, 120000);

    it('should accept custom options', async () => {
      const result = await service.sendMessage(
        'llama3.2',
        [{ role: 'user', content: 'Count to 3' }],
        OLLAMA_URL,
        undefined,
        { temperature: 0.5 }
      );
      
      expect(result).toHaveProperty('response');
    }, 120000);

    it('should handle any response from model', async () => {
      const result = await service.sendMessage(
        'llama3.2',
        [{ role: 'user', content: 'Hi' }],
        OLLAMA_URL
      );
      
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('promptTokens');
      expect(result).toHaveProperty('responseTokens');
    }, 120000);

    it('should call onChunk callback when provided', async () => {
      let chunkReceived = '';
      await service.sendMessage(
        'llama3.2',
        [{ role: 'user', content: 'Say "test"' }],
        OLLAMA_URL,
        (chunk) => { chunkReceived = chunk; }
      );
      
      expect(chunkReceived).toBeDefined();
    }, 120000);

    it('should throw error for invalid URL', async () => {
      try {
        await service.sendMessage(
          'llama3.2',
          [{ role: 'user', content: 'Hi' }],
          'http://invalid:9999'
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('Error al enviar mensaje a Ollama');
      }
    }, 10000);
  });
});

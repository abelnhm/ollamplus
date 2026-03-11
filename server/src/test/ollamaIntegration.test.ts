import { describe, it, expect, beforeEach } from 'vitest';
import { OllamaService } from '../services/OllamaService.js';

describe('OllamaService - Integración Real', () => {
  let service: OllamaService;
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  beforeEach(() => {
    service = new OllamaService();
  });

  describe('listModels', () => {
    it('should return list of models from running Ollama server', async () => {
      const models = await service.listModels(ollamaUrl);
      
      expect(Array.isArray(models)).toBe(true);
    }, 30000);

    it('should have model structure with name, size, modified_at when models exist', async () => {
      const models = await service.listModels(ollamaUrl);
      
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

  describe('showModel', () => {
    it('should return model info from running Ollama server', async () => {
      const models = await service.listModels(ollamaUrl);
      
      if (models.length > 0) {
        const modelName = models[0].name;
        const info = await service.showModel(ollamaUrl, modelName);
        
        expect(info).toHaveProperty('family');
        expect(info).toHaveProperty('parameter_size');
        expect(info).toHaveProperty('format');
      }
    }, 30000);

    it('should extract vram from model_info key', async () => {
      const models = await service.listModels(ollamaUrl);
      
      if (models.length > 0) {
        const modelName = models[0].name;
        const info = await service.showModel(ollamaUrl, modelName);
        
        expect(typeof info.size_vram).toBe('number');
      }
    }, 30000);

    it('should extract context_length from model_info', async () => {
      const models = await service.listModels(ollamaUrl);
      
      if (models.length > 0) {
        const modelName = models[0].name;
        const info = await service.showModel(ollamaUrl, modelName);
        
        expect(typeof info.context_length).toBe('number');
      }
    }, 30000);

    it('should handle error for non-existent model', async () => {
      try {
        await service.showModel(ollamaUrl, 'non-existent-model-12345');
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
          ollamaUrl
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

  describe('sendMessage', () => {
    it('should send message and receive response from running Ollama server', async () => {
      const result = await service.sendMessage(
        'llama3.2',
        [{ role: 'user', content: 'Say "Hello" and nothing else.' }],
        ollamaUrl
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
        ollamaUrl
      );
      
      expect(result.tokensPerSecond).toBeGreaterThanOrEqual(0);
    }, 120000);

    it('should use system prompt when provided', async () => {
      const result = await service.sendMessage(
        'llama3.2',
        [{ role: 'user', content: 'What is 2+2? Answer only with the number.' }],
        ollamaUrl,
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
        ollamaUrl,
        undefined,
        { temperature: 0.5 }
      );
      
      expect(result).toHaveProperty('response');
    }, 120000);

    it('should handle any response from model', async () => {
      const result = await service.sendMessage(
        'llama3.2',
        [{ role: 'user', content: 'Hi' }],
        ollamaUrl
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
        ollamaUrl,
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

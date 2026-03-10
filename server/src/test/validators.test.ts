import { describe, it, expect } from 'vitest';
import {
  createChatSchema,
  sendMessageSchema,
  updateChatSchema,
  editMessageSchema,
  importChatSchema
} from '../validators/chatValidator.js';

describe('Validators', () => {
  describe('createChatSchema', () => {
    it('should validate a correct chat creation', () => {
      const data = {
        model: 'llama3.1',
        title: 'My Chat'
      };

      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate without title (optional)', () => {
      const data = {
        model: 'llama3.1'
      };

      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail without model', () => {
      const data = {
        title: 'My Chat'
      };

      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail with empty model', () => {
      const data = {
        model: '',
        title: 'My Chat'
      };

      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept instructions', () => {
      const data = {
        model: 'llama3.1',
        title: 'My Chat',
        instructions: 'You are a helpful assistant.'
      };

      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('sendMessageSchema', () => {
    it('should validate a correct message', () => {
      const data = {
        content: 'Hello world'
      };

      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate without content (for regeneration)', () => {
      const data = {};

      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept ollamaUrl', () => {
      const data = {
        content: 'Hello',
        ollamaUrl: 'http://192.168.1.100:11434'
      };

      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid URL', () => {
      const data = {
        content: 'Hello',
        ollamaUrl: 'not-a-url'
      };

      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept options', () => {
      const data = {
        content: 'Hello',
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      };

      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept systemPrompt', () => {
      const data = {
        content: 'Hello',
        systemPrompt: 'You are a pirate.'
      };

      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('updateChatSchema', () => {
    it('should validate title update', () => {
      const data = {
        title: 'New Title'
      };

      const result = updateChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate model update', () => {
      const data = {
        model: 'llama3.1'
      };

      const result = updateChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate instructions update', () => {
      const data = {
        instructions: 'New instructions'
      };

      const result = updateChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate parameters update', () => {
      const data = {
        parameters: {
          temperature: 0.5
        }
      };

      const result = updateChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with empty title', () => {
      const data = {
        title: ''
      };

      const result = updateChatSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('editMessageSchema', () => {
    it('should validate a correct message edit', () => {
      const data = {
        content: 'Updated content'
      };

      const result = editMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with empty content', () => {
      const data = {
        content: ''
      };

      const result = editMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail without content', () => {
      const data = {};

      const result = editMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('importChatSchema', () => {
    it('should validate a correct import', () => {
      const data = {
        model: 'llama3.1',
        title: 'Imported Chat',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi!' }
        ]
      };

      const result = importChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail without model', () => {
      const data = {
        title: 'Imported Chat',
        messages: [{ role: 'user', content: 'Hello' }]
      };

      const result = importChatSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail without title', () => {
      const data = {
        model: 'llama3.1',
        messages: [{ role: 'user', content: 'Hello' }]
      };

      const result = importChatSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail without messages', () => {
      const data = {
        model: 'llama3.1',
        title: 'Imported Chat'
      };

      const result = importChatSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail with invalid role', () => {
      const data = {
        model: 'llama3.1',
        title: 'Imported Chat',
        messages: [
          { role: 'invalid', content: 'Hello' }
        ]
      };

      const result = importChatSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept system role in messages', () => {
      const data = {
        model: 'llama3.1',
        title: 'Imported Chat',
        messages: [
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'Hello' }
        ]
      };

      const result = importChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

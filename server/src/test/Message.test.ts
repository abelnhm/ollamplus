import { describe, it, expect } from 'vitest';
import { Message } from '../models/Message.js';

describe('Message Model', () => {
  describe('constructor', () => {
    it('should create a message with required fields', () => {
      const message = new Message({
        role: 'user',
        content: 'Hello world'
      });

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello world');
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('should create a message with custom id', () => {
      const message = new Message({
        id: 'custom-id',
        role: 'assistant',
        content: 'Response'
      });

      expect(message.id).toBe('custom-id');
    });

    it('should create a message with custom timestamp', () => {
      const customDate = new Date('2024-01-01');
      const message = new Message({
        role: 'system',
        content: 'System prompt',
        timestamp: customDate
      });

      expect(message.timestamp).toEqual(customDate);
    });

    it('should create a message with metrics', () => {
      const message = new Message({
        role: 'assistant',
        content: 'Response',
        metrics: {
          tokenCount: 100,
          durationMs: 5000,
          tokensPerSecond: 20
        }
      });

      expect(message.metrics).toEqual({
        tokenCount: 100,
        durationMs: 5000,
        tokensPerSecond: 20
      });
    });
  });

  describe('toJSON', () => {
    it('should serialize message to JSON', () => {
      const message = new Message({
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        metrics: { tokenCount: 10 }
      });

      const json = message.toJSON();

      expect(json).toEqual({
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        timestamp: message.timestamp.toISOString(),
        metrics: { tokenCount: 10 }
      });
    });

    it('should exclude undefined metrics', () => {
      const message = new Message({
        role: 'assistant',
        content: 'Response'
      });

      const json = message.toJSON();

      expect(json.metrics).toBeUndefined();
    });

    it('should include metrics when they have numeric values', () => {
      const message = new Message({
        role: 'assistant',
        content: 'Response',
        metrics: { durationMs: 5000 }
      });

      const json = message.toJSON();

      expect(json.metrics).toBeDefined();
    });

    it('should exclude metrics when all values are non-numeric', () => {
      const message = new Message({
        role: 'assistant',
        content: 'Response',
        metrics: {} as any
      });

      const json = message.toJSON();

      expect(json.metrics).toBeUndefined();
    });
  });
});

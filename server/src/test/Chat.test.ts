import { describe, it, expect } from 'vitest';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';

describe('Chat Model', () => {
  describe('constructor', () => {
    it('should create a chat with required fields', () => {
      const chat = new Chat({
        model: 'llama3.1',
        title: 'My Chat'
      });

      expect(chat.model).toBe('llama3.1');
      expect(chat.title).toBe('My Chat');
      expect(chat.id).toBeDefined();
      expect(chat.messages).toEqual([]);
      expect(chat.pinned).toBe(false);
    });

    it('should create a chat with default title', () => {
      const chat = new Chat({
        model: 'llama3.1'
      });

      expect(chat.title).toBe('Nuevo chat');
    });

    it('should create a chat with custom id', () => {
      const chat = new Chat({
        id: 'custom-chat-id',
        model: 'llama3.1',
        title: 'Custom Chat'
      });

      expect(chat.id).toBe('custom-chat-id');
    });

    it('should create a chat with instructions', () => {
      const chat = new Chat({
        model: 'llama3.1',
        title: 'Test Chat',
        instructions: 'You are a helpful assistant.'
      });

      expect(chat.instructions).toBe('You are a helpful assistant.');
    });

    it('should create a chat with parameters', () => {
      const chat = new Chat({
        model: 'llama3.1',
        title: 'Test Chat',
        parameters: {
          temperature: 0.7,
          topP: 0.9
        }
      });

      expect(chat.parameters).toEqual({
        temperature: 0.7,
        topP: 0.9
      });
    });

    it('should create a chat with modelInfo', () => {
      const chat = new Chat({
        model: 'llama3.1',
        title: 'Test Chat',
        modelInfo: {
          size: '4.7GB',
          family: 'llama'
        }
      });

      expect(chat.modelInfo).toEqual({
        size: '4.7GB',
        family: 'llama'
      });
    });

    it('should create a chat with initial messages', () => {
      const messages = [
        new Message({ role: 'system', content: 'System prompt' }),
        new Message({ role: 'user', content: 'Hello' })
      ];

      const chat = new Chat({
        model: 'llama3.1',
        title: 'Test Chat',
        messages
      });

      expect(chat.messages).toHaveLength(2);
    });

    it('should create a pinned chat', () => {
      const chat = new Chat({
        model: 'llama3.1',
        title: 'Pinned Chat',
        pinned: true
      });

      expect(chat.pinned).toBe(true);
    });
  });

  describe('addMessage', () => {
    it('should add a message to the chat', () => {
      const chat = new Chat({
        model: 'llama3.1',
        title: 'Test Chat'
      });

      const message = new Message({ role: 'user', content: 'Hello' });
      chat.addMessage(message);

      expect(chat.messages).toHaveLength(1);
      expect(chat.messages[0]).toEqual(message);
    });

    it('should update lastMessageAt when adding a message', () => {
      const chat = new Chat({
        model: 'llama3.1',
        title: 'Test Chat'
      });

      const beforeAdd = chat.lastMessageAt;
      
      const message = new Message({ role: 'user', content: 'Hello' });
      chat.addMessage(message);

      expect(chat.lastMessageAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
    });
  });

  describe('getHistory', () => {
    it('should return messages in expected format', () => {
      const chat = new Chat({
        model: 'llama3.1',
        title: 'Test Chat'
      });

      chat.addMessage(new Message({ role: 'user', content: 'Hello' }));
      chat.addMessage(new Message({ role: 'assistant', content: 'Hi there!' }));

      const history = chat.getHistory();

      expect(history).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]);
    });
  });

  describe('toJSON', () => {
    it('should serialize chat to JSON', () => {
      const chat = new Chat({
        id: 'chat-1',
        model: 'llama3.1',
        title: 'Test Chat',
        instructions: 'Be helpful',
        parameters: { temperature: 0.5 },
        modelInfo: { size: '4GB' }
      });

      chat.addMessage(new Message({ role: 'user', content: 'Hello' }));

      const json = chat.toJSON();

      expect(json.id).toBe('chat-1');
      expect(json.model).toBe('llama3.1');
      expect(json.title).toBe('Test Chat');
      expect(json.instructions).toBe('Be helpful');
      expect(json.parameters).toEqual({ temperature: 0.5 });
      expect(json.modelInfo).toEqual({ size: '4GB' });
      expect(json.messages).toHaveLength(1);
      expect(json.messageCount).toBe(1);
      expect(json.pinned).toBe(false);
      expect(json.createdAt).toBeDefined();
      expect(json.lastMessageAt).toBeDefined();
    });

    it('should convert dates to ISO strings', () => {
      const chat = new Chat({
        model: 'llama3.1',
        title: 'Test Chat'
      });

      const json = chat.toJSON();

      expect(json.createdAt).toBe(chat.createdAt.toISOString());
      expect(json.lastMessageAt).toBe(chat.lastMessageAt.toISOString());
    });
  });
});

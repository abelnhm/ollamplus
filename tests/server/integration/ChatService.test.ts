import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChatService } from '../../../server/src/services/ChatService.js';
import { db } from '../../../server/src/services/database.js';

describe('ChatService', () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
    db.prepare('DELETE FROM messages').run();
    db.prepare('DELETE FROM chats').run();
    db.prepare('DELETE FROM app_config').run();
  });

  afterEach(() => {
    db.prepare('DELETE FROM messages').run();
    db.prepare('DELETE FROM chats').run();
    db.prepare('DELETE FROM app_config').run();
  });

  describe('create', () => {
    it('should create a new chat', () => {
      const chat = chatService.create('llama2', 'Test Chat');

      expect(chat).toBeDefined();
      expect(chat.id).toBeDefined();
      expect(chat.model).toBe('llama2');
      expect(chat.title).toBe('Test Chat');
    });

    it('should create chat with instructions', () => {
      const chat = chatService.create('llama2', 'Test', 'You are a helpful assistant');

      expect(chat.instructions).toBe('You are a helpful assistant');
    });

    it('should create chat with parameters', () => {
      const chat = chatService.create('llama2', 'Test', undefined, { temperature: 0.7 });

      expect(chat.parameters).toEqual({ temperature: 0.7 });
    });
  });

  describe('getById', () => {
    it('should return chat by id', () => {
      const created = chatService.create('llama2', 'Test Chat');
      const found = chatService.getById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return null for non-existent chat', () => {
      const found = chatService.getById('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all chats', () => {
      chatService.create('llama2', 'Chat 1');
      chatService.create('llama2', 'Chat 2');

      const chats = chatService.getAll();

      expect(chats.length).toBe(2);
    });
  });

  describe('rename', () => {
    it('should rename a chat', () => {
      const chat = chatService.create('llama2', 'Old Title');
      const renamed = chatService.rename(chat.id, 'New Title');

      expect(renamed.title).toBe('New Title');
    });

    it('should throw error for non-existent chat', () => {
      expect(() => chatService.rename('non-existent', 'New Title')).toThrow('no encontrado');
    });
  });

  describe('updateInstructions', () => {
    it('should update instructions', () => {
      const chat = chatService.create('llama2', 'Test');
      const updated = chatService.updateInstructions(chat.id, 'New instructions');

      expect(updated.instructions).toBe('New instructions');
    });

    it('should throw error for non-existent chat', () => {
      expect(() => chatService.updateInstructions('non-existent', 'instructions')).toThrow('no encontrado');
    });
  });

  describe('updateParameters', () => {
    it('should update parameters', () => {
      const chat = chatService.create('llama2', 'Test');
      const updated = chatService.updateParameters(chat.id, { temperature: 0.9 });

      expect(updated.parameters).toEqual({ temperature: 0.9 });
    });

    it('should throw error for non-existent chat', () => {
      expect(() => chatService.updateParameters('non-existent', { temperature: 0.9 })).toThrow('no encontrado');
    });
  });

  describe('updateModelInfo', () => {
    it('should update model info', () => {
      const chat = chatService.create('llama2', 'Test');
      const updated = chatService.updateModelInfo(chat.id, { size: '7B' });

      expect(updated.modelInfo).toEqual({ size: '7B' });
    });

    it('should throw error for non-existent chat', () => {
      expect(() => chatService.updateModelInfo('non-existent', { size: '7B' })).toThrow('no encontrado');
    });
  });

  describe('changeModel', () => {
    it('should change model', () => {
      const chat = chatService.create('llama2', 'Test');
      const updated = chatService.changeModel(chat.id, 'mistral');

      expect(updated.model).toBe('mistral');
    });

    it('should throw error for non-existent chat', () => {
      expect(() => chatService.changeModel('non-existent', 'mistral')).toThrow('no encontrado');
    });
  });

  describe('delete', () => {
    it('should delete a chat', () => {
      const chat = chatService.create('llama2', 'Test');
      chatService.delete(chat.id);

      const found = chatService.getById(chat.id);
      expect(found).toBeNull();
    });

    it('should delete messages when chat is deleted', () => {
      const chat = chatService.create('llama2', 'Test');
      chatService.addMessage(chat.id, 'user', 'Hello');

      chatService.delete(chat.id);

      const messages = db.prepare('SELECT * FROM messages WHERE chat_id = ?').all(chat.id);
      expect(messages.length).toBe(0);
    });

    it('should throw error for non-existent chat', () => {
      expect(() => chatService.delete('non-existent')).toThrow('no encontrado');
    });
  });

  describe('addMessage', () => {
    it('should add message to chat', () => {
      const chat = chatService.create('llama2', 'Test');
      const message = chatService.addMessage(chat.id, 'user', 'Hello world');

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello world');
    });

    it('should add message with metrics', () => {
      const chat = chatService.create('llama2', 'Test');
      const message = chatService.addMessage(chat.id, 'assistant', 'Response', {
        tokenCount: 100,
        durationMs: 5000,
        tokensPerSecond: 20
      });

      expect(message.metrics?.tokenCount).toBe(100);
    });

    it('should throw error for non-existent chat', () => {
      expect(() => chatService.addMessage('non-existent', 'user', 'Hello')).toThrow('no encontrado');
    });
  });

  describe('togglePin', () => {
    it('should toggle pin', () => {
      const chat = chatService.create('llama2', 'Test');
      expect(chat.pinned).toBe(false);

      const toggled = chatService.togglePin(chat.id);
      expect(toggled.pinned).toBe(true);

      const toggledAgain = chatService.togglePin(chat.id);
      expect(toggledAgain.pinned).toBe(false);
    });

    it('should throw error for non-existent chat', () => {
      expect(() => chatService.togglePin('non-existent')).toThrow('no encontrado');
    });
  });

  describe('search', () => {
    it('should search by title', () => {
      chatService.create('llama2', 'My Test Chat');
      chatService.create('llama2', 'Other Chat');

      const results = chatService.search('test');

      expect(results.length).toBe(1);
      expect(results[0].title).toBe('My Test Chat');
    });

    it('should search by message content', () => {
      const chat = chatService.create('llama2', 'Chat');
      chatService.addMessage(chat.id, 'user', 'Hello world');

      const results = chatService.search('hello');

      expect(results.length).toBe(1);
    });
  });

  describe('removeLastMessage', () => {
    it('should remove last message', () => {
      const chat = chatService.create('llama2', 'Test');
      chatService.addMessage(chat.id, 'user', 'Message 1');
      chatService.addMessage(chat.id, 'user', 'Message 2');

      chatService.removeLastMessage(chat.id);

      const updated = chatService.getById(chat.id);
      expect(updated?.messages.length).toBe(1);
    });

    it('should throw error for chat without messages', () => {
      const chat = chatService.create('llama2', 'Test');

      expect(() => chatService.removeLastMessage(chat.id)).toThrow('no tiene mensajes');
    });

    it('should throw error for non-existent chat', () => {
      expect(() => chatService.removeLastMessage('non-existent')).toThrow('no encontrado');
    });
  });

  describe('truncateAtMessage', () => {
    it('should truncate at message and update content', () => {
      const chat = chatService.create('llama2', 'Test');
      const msg1 = chatService.addMessage(chat.id, 'user', 'Message 1');
      const msg2 = chatService.addMessage(chat.id, 'user', 'Message 2');

      const result = chatService.truncateAtMessage(chat.id, msg1.id, 'Updated content');

      expect(result.content).toBe('Updated content');
      const updated = chatService.getById(chat.id);
      expect(updated?.messages.length).toBe(1);
    });

    it('should throw error for non-existent chat', () => {
      expect(() => chatService.truncateAtMessage('non-existent', 'msg-id', 'content')).toThrow('no encontrado');
    });

    it('should throw error for non-existent message', () => {
      const chat = chatService.create('llama2', 'Test');
      chatService.addMessage(chat.id, 'user', 'Message');

      expect(() => chatService.truncateAtMessage(chat.id, 'non-existent-msg', 'content')).toThrow('no encontrado');
    });
  });

  describe('getAppConfig', () => {
    it('should get app config', () => {
      chatService.setAppConfig('theme', 'dark');
      const value = chatService.getAppConfig('theme');

      expect(value).toBe('dark');
    });

    it('should return null for non-existent key', () => {
      const value = chatService.getAppConfig('non-existent');

      expect(value).toBeNull();
    });
  });

  describe('setAppConfig', () => {
    it('should set app config', () => {
      chatService.setAppConfig('theme', 'light');

      const value = chatService.getAppConfig('theme');
      expect(value).toBe('light');
    });
  });

  describe('deleteAllChats', () => {
    it('should delete all chats', () => {
      chatService.create('llama2', 'Chat 1');
      chatService.create('llama2', 'Chat 2');

      chatService.deleteAllChats();

      const chats = chatService.getAll();
      expect(chats.length).toBe(0);
    });
  });
});

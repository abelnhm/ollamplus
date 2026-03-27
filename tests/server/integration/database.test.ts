import { describe, it, expect } from 'vitest';
import { db, AppConfigRow, ChatRow, MessageRow } from '../../../server/src/services/database.js';

describe('Database', () => {
  it('should have a valid database connection', () => {
    expect(db).toBeDefined();
    expect(db.name).toBeDefined();
  });

  it('should have app_config table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='app_config'").get();
    expect(result).toBeDefined();
  });

  it('should have chats table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chats'").get();
    expect(result).toBeDefined();
  });

  it('should have messages table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'").get();
    expect(result).toBeDefined();
  });

  it('should have indexes', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all();
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('should insert and retrieve app_config', () => {
    const key = 'test_key';
    const value = 'test_value';
    const now = new Date().toISOString();

    db.prepare('INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES (?, ?, ?)').run(key, value, now);
    const row = db.prepare('SELECT * FROM app_config WHERE key = ?').get(key) as AppConfigRow;

    expect(row.key).toBe(key);
    expect(row.value).toBe(value);
  });

  it('should insert and retrieve chat', () => {
    const chatId = 'test-chat-id-' + Date.now();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO chats (id, title, model, instructions, parameters, model_info, created_at, last_message_at, pinned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(chatId, 'Test Chat', 'llama2', '', '{}', '{}', now, now, 0);

    const row = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId) as ChatRow;

    expect(row.id).toBe(chatId);
    expect(row.title).toBe('Test Chat');
    expect(row.model).toBe('llama2');
  });

  it('should insert and retrieve message', () => {
    const chatId = 'test-chat-id-msg-' + Date.now();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO chats (id, title, model, instructions, parameters, model_info, created_at, last_message_at, pinned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(chatId, 'Test Chat', 'llama2', '', '{}', '{}', now, now, 0);

    const msgId = 'test-msg-id-' + Date.now();
    db.prepare(`
      INSERT INTO messages (id, chat_id, role, content, timestamp, token_count, duration_ms, tokens_per_second)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(msgId, chatId, 'user', 'Hello', now, 10, 1000, 10);

    const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(msgId) as MessageRow;

    expect(row.id).toBe(msgId);
    expect(row.chat_id).toBe(chatId);
    expect(row.role).toBe('user');
    expect(row.content).toBe('Hello');
    expect(row.token_count).toBe(10);
  });

  it('should delete messages when chat is deleted', () => {
    const chatId = 'test-chat-delete-' + Date.now();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO chats (id, title, model, instructions, parameters, model_info, created_at, last_message_at, pinned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(chatId, 'Test Chat', 'llama2', '', '{}', '{}', now, now, 0);

    const msgId = 'test-msg-delete-' + Date.now();
    db.prepare(`
      INSERT INTO messages (id, chat_id, role, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(msgId, chatId, 'user', 'Hello', now);

    db.prepare('DELETE FROM chats WHERE id = ?').run(chatId);

    const messages = db.prepare('SELECT * FROM messages WHERE chat_id = ?').all(chatId);
    expect(messages.length).toBe(0);
  });
});

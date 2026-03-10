import { Chat, type ChatData, type ChatParameters } from "../models/Chat.js";
import { Message, type MessageMetrics } from "../models/Message.js";
import { db, type ChatRow, type MessageRow } from "./database.js";

export class ChatService {
  private mapChatRowToChat(row: ChatRow): Chat {
    const messages = this.getMessagesByChatId(row.id);
    return new Chat({
      id: row.id,
      model: row.model,
      title: row.title,
      instructions: row.instructions || "",
      parameters: JSON.parse(row.parameters || "{}"),
      modelInfo: JSON.parse(row.model_info || "{}"),
      messages,
      createdAt: new Date(row.created_at),
      lastMessageAt: new Date(row.last_message_at),
      pinned: row.pinned === 1,
    });
  }

  private mapMessageRowToMessage(row: MessageRow): Message {
    const metrics: MessageMetrics | undefined =
      row.token_count || row.duration_ms || row.tokens_per_second
        ? {
            tokenCount: row.token_count || undefined,
            durationMs: row.duration_ms || undefined,
            tokensPerSecond: row.tokens_per_second || undefined,
          }
        : undefined;

    return new Message({
      id: row.id,
      role: row.role,
      content: row.content,
      timestamp: new Date(row.timestamp),
      metrics,
    });
  }

  private getMessagesByChatId(chatId: string): Message[] {
    const rows = db
      .prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC")
      .all(chatId) as MessageRow[];
    return rows.map((row) => this.mapMessageRowToMessage(row));
  }

  create(model: string, title?: string, instructions?: string, parameters?: ChatParameters, modelInfo?: ChatData["modelInfo"]): Chat {
    const chat = new Chat({ model, title, instructions, parameters, modelInfo });
    const now = new Date().toISOString();

    db.prepare(
      "INSERT INTO chats (id, title, model, instructions, parameters, model_info, created_at, last_message_at, pinned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      chat.id,
      chat.title,
      chat.model,
      chat.instructions || "",
      JSON.stringify(chat.parameters),
      JSON.stringify(chat.modelInfo),
      now,
      now,
      chat.pinned ? 1 : 0
    );

    return chat;
  }

  getById(chatId: string): Chat | null {
    const row = db.prepare("SELECT * FROM chats WHERE id = ?").get(chatId) as ChatRow | undefined;
    if (!row) return null;
    return this.mapChatRowToChat(row);
  }

  getAll(): Chat[] {
    const rows = db
      .prepare("SELECT * FROM chats ORDER BY pinned DESC, last_message_at DESC")
      .all() as ChatRow[];
    return rows.map((row) => this.mapChatRowToChat(row));
  }

  rename(chatId: string, newTitle: string): Chat {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    chat.title = newTitle;
    db.prepare("UPDATE chats SET title = ? WHERE id = ?").run(newTitle, chatId);
    return chat;
  }

  updateInstructions(chatId: string, instructions: string): Chat {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    chat.instructions = instructions;
    db.prepare("UPDATE chats SET instructions = ? WHERE id = ?").run(instructions, chatId);
    return chat;
  }

  updateParameters(chatId: string, parameters: ChatParameters): Chat {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    chat.parameters = parameters;
    db.prepare("UPDATE chats SET parameters = ? WHERE id = ?").run(JSON.stringify(parameters), chatId);
    return chat;
  }

  updateModelInfo(chatId: string, modelInfo: { size?: string; family?: string; format?: string; quantization?: string }): Chat {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    chat.modelInfo = modelInfo;
    db.prepare("UPDATE chats SET model_info = ? WHERE id = ?").run(JSON.stringify(modelInfo), chatId);
    return chat;
  }

  changeModel(chatId: string, newModel: string): Chat {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    chat.model = newModel;
    db.prepare("UPDATE chats SET model = ? WHERE id = ?").run(newModel, chatId);
    return chat;
  }

  delete(chatId: string): void {
    const existing = db.prepare("SELECT id FROM chats WHERE id = ?").get(chatId);
    if (!existing) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    db.prepare("DELETE FROM messages WHERE chat_id = ?").run(chatId);
    db.prepare("DELETE FROM chats WHERE id = ?").run(chatId);
  }

  addMessage(
    chatId: string,
    role: string,
    content: string,
    metrics?: MessageMetrics,
  ): Message {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    const message = new Message({ role, content, metrics });
    const now = new Date().toISOString();

    db.prepare(
      "INSERT INTO messages (id, chat_id, role, content, timestamp, token_count, duration_ms, tokens_per_second) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      message.id,
      chatId,
      message.role,
      message.content,
      now,
      metrics?.tokenCount ?? null,
      metrics?.durationMs ?? null,
      metrics?.tokensPerSecond ?? null,
    );

    db.prepare("UPDATE chats SET last_message_at = ? WHERE id = ?").run(now, chatId);
    chat.addMessage(message);
    return message;
  }

  togglePin(chatId: string): Chat {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    chat.pinned = !chat.pinned;
    db.prepare("UPDATE chats SET pinned = ? WHERE id = ?").run(chat.pinned ? 1 : 0, chatId);
    return chat;
  }

  search(query: string): Chat[] {
    const q = query.toLowerCase();
    const allChats = this.getAll();
    return allChats.filter((chat) => {
      if (chat.title.toLowerCase().includes(q)) return true;
      return chat.messages.some((msg) => msg.content.toLowerCase().includes(q));
    });
  }

  removeLastMessage(chatId: string): void {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    if (chat.messages.length === 0) {
      throw new Error("El chat no tiene mensajes");
    }
    const lastMessage = chat.messages[chat.messages.length - 1];
    db.prepare("DELETE FROM messages WHERE id = ?").run(lastMessage.id);
    chat.messages.pop();

    const lastMsgTimestamp =
      chat.messages.length > 0
        ? chat.messages[chat.messages.length - 1].timestamp.toISOString()
        : chat.createdAt.toISOString();
    db.prepare("UPDATE chats SET last_message_at = ? WHERE id = ?").run(lastMsgTimestamp, chatId);
  }

  truncateAtMessage(
    chatId: string,
    messageId: string,
    newContent: string,
  ): Message {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    const idx = chat.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) {
      throw new Error(`Mensaje con ID ${messageId} no encontrado`);
    }
    const messagesToDelete = chat.messages.slice(idx + 1);
    for (const msg of messagesToDelete) {
      db.prepare("DELETE FROM messages WHERE id = ?").run(msg.id);
    }
    chat.messages = chat.messages.slice(0, idx + 1);
    chat.messages[idx].content = newContent;
    db.prepare("UPDATE messages SET content = ? WHERE id = ?").run(newContent, messageId);
    return chat.messages[idx];
  }

  getAppConfig(key: string): string | null {
    const row = db.prepare("SELECT value FROM app_config WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  setAppConfig(key: string, value: string): void {
    const now = new Date().toISOString();
    db.prepare(
      "INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES (?, ?, ?)"
    ).run(key, value, now);
  }

  deleteAllChats(): void {
    db.prepare("DELETE FROM messages").run();
    db.prepare("DELETE FROM chats").run();
  }
}

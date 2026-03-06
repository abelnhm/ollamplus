import { Chat } from "../models/Chat.js";
import { Message } from "../models/Message.js";

/**
 * Servicio: ChatService
 * Gestiona toda la lógica de negocio relacionada con los chats.
 *
 * Almacena los chats en memoria usando un Map.
 * En un proyecto real se reemplazaría por una base de datos.
 */
export class ChatService {
  #chats = new Map<string, Chat>();

  create(model: string, title: string): Chat {
    const chat = new Chat({ model, title });
    this.#chats.set(chat.id, chat);
    return chat;
  }

  getById(chatId: string): Chat | null {
    return this.#chats.get(chatId) || null;
  }

  getAll(): Chat[] {
    return Array.from(this.#chats.values());
  }

  rename(chatId: string, newTitle: string): Chat {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    chat.title = newTitle;
    return chat;
  }

  delete(chatId: string): void {
    if (!this.#chats.has(chatId)) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    this.#chats.delete(chatId);
  }

  addMessage(chatId: string, role: string, content: string): Message {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    const message = new Message({ role, content });
    chat.addMessage(message);
    return message;
  }

  togglePin(chatId: string): Chat {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    chat.pinned = !chat.pinned;
    return chat;
  }

  search(query: string): Chat[] {
    const q = query.toLowerCase();
    return this.getAll().filter((chat) => {
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
    chat.messages.pop();
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
    // Truncar: conservar mensajes hasta el editado (inclusive) y descartar el resto
    chat.messages = chat.messages.slice(0, idx + 1);
    // Actualizar contenido del mensaje editado
    chat.messages[idx].content = newContent;
    return chat.messages[idx];
  }
}

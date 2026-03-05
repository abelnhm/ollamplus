import { randomUUID } from "crypto";
import { Message } from "./Message.js";

/**
 * Modelo: Chat
 * Representa una conversación completa con un modelo de IA.
 */

export interface ChatData {
  id?: string;
  model: string;
  title: string;
  messages?: Message[];
  createdAt?: Date;
  lastMessageAt?: Date;
}

export class Chat {
  id: string;
  model: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;

  constructor({
    id,
    model,
    title,
    messages = [],
    createdAt,
    lastMessageAt,
  }: ChatData) {
    this.id = id || randomUUID();
    this.model = model;
    this.title = title;
    this.messages = messages;
    this.createdAt = createdAt || new Date();
    this.lastMessageAt = lastMessageAt || new Date();
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    this.lastMessageAt = new Date();
  }

  getHistory(): { role: string; content: string }[] {
    return this.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  toJSON() {
    return {
      id: this.id,
      model: this.model,
      title: this.title,
      messages: this.messages.map((msg) => msg.toJSON()),
      createdAt: this.createdAt.toISOString(),
      lastMessageAt: this.lastMessageAt.toISOString(),
      messageCount: this.messages.length,
    };
  }
}

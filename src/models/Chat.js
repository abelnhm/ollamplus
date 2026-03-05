import { randomUUID } from "crypto";
import { Message } from "./Message.js";

/**
 * Modelo: Chat
 * Representa una conversación completa con un modelo de IA.
 *
 * CAPA: Modelos (datos)
 * RESPONSABILIDAD: Definir la estructura de un chat y sus operaciones básicas.
 */
export class Chat {
  constructor({ id, model, title, messages = [], createdAt, lastMessageAt }) {
    this.id = id || randomUUID();
    this.model = model;
    this.title = title;
    this.messages = messages;
    this.createdAt = createdAt || new Date();
    this.lastMessageAt = lastMessageAt || new Date();
  }

  /**
   * Agrega un mensaje al chat y actualiza la fecha del último mensaje.
   */
  addMessage(message) {
    this.messages.push(message);
    this.lastMessageAt = new Date();
  }

  /**
   * Devuelve el historial de mensajes en el formato que espera Ollama.
   * Ollama necesita un array de objetos { role, content }.
   */
  getHistory() {
    return this.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Convierte el chat a un objeto plano (JSON) para enviarlo como respuesta HTTP.
   */
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

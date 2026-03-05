import { ChatId } from "../value-objects/ChatId.js";
import { ModelName } from "../value-objects/ModelName.js";
import { Message } from "./Message.js";
import { MessageRole } from "../value-objects/MessageRole.js";

/**
 * Entity: Chat (Aggregate Root)
 * Representa una conversación completa
 * Principio: Aggregate - Mantiene la consistencia de los mensajes
 */
export class Chat {
  #id;
  #model;
  #title;
  #messages;
  #createdAt;
  #lastMessageAt;

  constructor(
    id,
    model,
    title,
    messages = [],
    createdAt = new Date(),
    lastMessageAt = new Date(),
  ) {
    if (!(id instanceof ChatId)) {
      throw new Error("id debe ser una instancia de ChatId");
    }
    if (!(model instanceof ModelName)) {
      throw new Error("model debe ser una instancia de ModelName");
    }
    if (typeof title !== "string" || title.trim().length === 0) {
      throw new Error("title debe ser un string no vacío");
    }

    this.#id = id;
    this.#model = model;
    this.#title = title.trim();
    this.#messages = messages;
    this.#createdAt = createdAt;
    this.#lastMessageAt = lastMessageAt;
  }

  get id() {
    return this.#id;
  }

  get model() {
    return this.#model;
  }

  get title() {
    return this.#title;
  }

  get messages() {
    return [...this.#messages]; // Devolver copia para inmutabilidad
  }

  get createdAt() {
    return this.#createdAt;
  }

  get lastMessageAt() {
    return this.#lastMessageAt;
  }

  get messageCount() {
    return this.#messages.length;
  }

  /**
   * Agrega un mensaje al chat
   * Principio: Command - Modifica el estado del agregado
   */
  addMessage(message) {
    if (!(message instanceof Message)) {
      throw new Error("message debe ser una instancia de Message");
    }

    this.#messages.push(message);
    this.#lastMessageAt = new Date();
  }

  /**
   * Limpia todos los mensajes del chat
   */
  clearMessages() {
    this.#messages = [];
    this.#lastMessageAt = new Date();
  }

  /**
   * Obtiene el historial en formato para Ollama
   */
  getOllamaHistory() {
    return this.#messages.map((msg) => msg.toOllamaFormat());
  }

  /**
   * Actualiza el título del chat
   */
  updateTitle(newTitle) {
    if (typeof newTitle !== "string" || newTitle.trim().length === 0) {
      throw new Error("El título debe ser un string no vacío");
    }
    this.#title = newTitle.trim();
  }

  /**
   * Crea una instancia desde datos planos
   */
  static fromPrimitives(data) {
    const messages = (data.messages || []).map((msg) =>
      Message.fromPrimitives(msg),
    );

    return new Chat(
      new ChatId(data.id),
      new ModelName(data.model),
      data.title,
      messages,
      data.createdAt ? new Date(data.createdAt) : new Date(),
      data.lastMessageAt ? new Date(data.lastMessageAt) : new Date(),
    );
  }

  /**
   * Convierte a objeto plano
   */
  toPrimitives() {
    return {
      id: this.#id.value,
      model: this.#model.value,
      title: this.#title,
      messages: this.#messages.map((msg) => msg.toPrimitives()),
      createdAt: this.#createdAt.toISOString(),
      lastMessageAt: this.#lastMessageAt.toISOString(),
      messageCount: this.#messages.length,
    };
  }

  /**
   * Crea un nuevo chat
   */
  static create(model, title) {
    return new Chat(
      ChatId.generate(),
      model,
      title,
      [],
      new Date(),
      new Date(),
    );
  }
}

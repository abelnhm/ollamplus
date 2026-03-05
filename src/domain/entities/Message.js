import { MessageId } from "../value-objects/MessageId.js";
import { MessageRole } from "../value-objects/MessageRole.js";

/**
 * Entity: Message
 * Representa un mensaje en una conversación
 * Principio: Single Responsibility - Solo maneja datos de mensaje
 */
export class Message {
  #id;
  #role;
  #content;
  #timestamp;

  constructor(id, role, content, timestamp = new Date()) {
    if (!(id instanceof MessageId)) {
      throw new Error("id debe ser una instancia de MessageId");
    }
    if (!(role instanceof MessageRole)) {
      throw new Error("role debe ser una instancia de MessageRole");
    }
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new Error("content debe ser un string no vacío");
    }

    this.#id = id;
    this.#role = role;
    this.#content = content.trim();
    this.#timestamp = timestamp;
  }

  get id() {
    return this.#id;
  }

  get role() {
    return this.#role;
  }

  get content() {
    return this.#content;
  }

  get timestamp() {
    return this.#timestamp;
  }

  /**
   * Crea una instancia de Message desde datos planos
   */
  static fromPrimitives(data) {
    return new Message(
      new MessageId(data.id),
      MessageRole.fromString(data.role),
      data.content,
      data.timestamp ? new Date(data.timestamp) : new Date(),
    );
  }

  /**
   * Convierte el mensaje a un objeto plano
   */
  toPrimitives() {
    return {
      id: this.#id.value,
      role: this.#role.value,
      content: this.#content,
      timestamp: this.#timestamp.toISOString(),
    };
  }

  /**
   * Convierte a formato compatible con API de Ollama
   */
  toOllamaFormat() {
    return {
      role: this.#role.value,
      content: this.#content,
    };
  }
}

/**
 * Value Object: ChatId
 * Representa el identificador único de un chat
 */
export class ChatId {
  #value;

  constructor(value) {
    if (!value || typeof value !== "string") {
      throw new Error("ChatId debe ser un string válido");
    }
    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  equals(other) {
    return other instanceof ChatId && other.#value === this.#value;
  }

  toString() {
    return this.#value;
  }

  static generate() {
    return new ChatId(crypto.randomUUID());
  }
}

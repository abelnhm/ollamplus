/**
 * Value Object: MessageId
 * Representa el identificador único de un mensaje
 */
export class MessageId {
  #value;

  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('MessageId debe ser un string válido');
    }
    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  equals(other) {
    return other instanceof MessageId && other.#value === this.#value;
  }

  toString() {
    return this.#value;
  }

  static generate() {
    return new MessageId(crypto.randomUUID());
  }
}

/**
 * Enum: MessageRole
 * Representa el rol de un mensaje en la conversación
 */
export class MessageRole {
  static USER = new MessageRole("user");
  static ASSISTANT = new MessageRole("assistant");
  static SYSTEM = new MessageRole("system");

  #value;

  constructor(value) {
    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  equals(other) {
    return other instanceof MessageRole && other.#value === this.#value;
  }

  toString() {
    return this.#value;
  }

  static fromString(value) {
    switch (value) {
      case "user":
        return MessageRole.USER;
      case "assistant":
        return MessageRole.ASSISTANT;
      case "system":
        return MessageRole.SYSTEM;
      default:
        throw new Error(`Rol de mensaje inválido: ${value}`);
    }
  }
}

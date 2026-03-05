/**
 * Value Object: ModelName
 * Representa el nombre de un modelo de IA
 */
export class ModelName {
  #value;

  constructor(value) {
    if (!value || typeof value !== "string") {
      throw new Error("ModelName debe ser un string válido");
    }
    this.#value = value.trim();
  }

  get value() {
    return this.#value;
  }

  equals(other) {
    return other instanceof ModelName && other.#value === this.#value;
  }

  toString() {
    return this.#value;
  }
}

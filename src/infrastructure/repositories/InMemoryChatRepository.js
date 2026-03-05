import { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import { Chat } from "../../domain/entities/Chat.js";

/**
 * Infrastructure: InMemoryChatRepository
 * Implementación en memoria del repositorio de chats
 * Principio: Liskov Substitution - Puede sustituirse por cualquier implementación de ChatRepository
 */
export class InMemoryChatRepository extends ChatRepository {
  #chats;

  constructor() {
    super();
    this.#chats = new Map();
  }

  async save(chat) {
    if (!(chat instanceof Chat)) {
      throw new Error("El parámetro debe ser una instancia de Chat");
    }

    this.#chats.set(chat.id.value, chat);
  }

  async findById(chatId) {
    const chat = this.#chats.get(chatId.value);
    return chat || null;
  }

  async findAll() {
    return Array.from(this.#chats.values());
  }

  async delete(chatId) {
    this.#chats.delete(chatId.value);
  }

  async exists(chatId) {
    return this.#chats.has(chatId.value);
  }

  /**
   * Método auxiliar para limpiar todos los chats (útil para testing)
   */
  clear() {
    this.#chats.clear();
  }
}

import { ChatId } from "../../domain/value-objects/ChatId.js";

/**
 * Use Case: GetChatById
 * Caso de uso para obtener un chat específico por su ID
 */
export class GetChatByIdUseCase {
  #chatRepository;

  constructor(chatRepository) {
    this.#chatRepository = chatRepository;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params
   * @param {string} params.chatId - ID del chat
   * @returns {Promise<Object|null>} Chat en formato DTO o null
   */
  async execute({ chatId }) {
    if (!chatId) {
      throw new Error("chatId es requerido");
    }

    const chat = await this.#chatRepository.findById(new ChatId(chatId));

    return chat ? chat.toPrimitives() : null;
  }
}

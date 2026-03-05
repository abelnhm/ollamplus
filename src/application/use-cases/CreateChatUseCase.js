import { Chat } from "../../domain/entities/Chat.js";
import { ModelName } from "../../domain/value-objects/ModelName.js";

/**
 * Use Case: CreateChat
 * Caso de uso para crear un nuevo chat
 * Principio: Single Responsibility - Solo crea chats
 */
export class CreateChatUseCase {
  #chatRepository;

  constructor(chatRepository) {
    this.#chatRepository = chatRepository;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params - Parámetros del chat
   * @param {string} params.model - Nombre del modelo
   * @param {string} params.title - Título del chat
   * @returns {Promise<Object>} Chat creado en formato plano
   */
  async execute({ model, title }) {
    // Validar entrada
    if (!model || !title) {
      throw new Error("model y title son requeridos");
    }

    // Crear entidad de dominio
    const chat = Chat.create(new ModelName(model), title);

    // Persistir
    await this.#chatRepository.save(chat);

    // Retornar DTO
    return chat.toPrimitives();
  }
}

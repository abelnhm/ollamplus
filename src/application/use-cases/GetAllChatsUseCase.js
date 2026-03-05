/**
 * Use Case: GetAllChats
 * Caso de uso para obtener todos los chats guardados
 */
export class GetAllChatsUseCase {
  #chatRepository;

  constructor(chatRepository) {
    this.#chatRepository = chatRepository;
  }

  /**
   * Ejecuta el caso de uso
   * @returns {Promise<Array>} Lista de chats en formato DTO
   */
  async execute() {
    const chats = await this.#chatRepository.findAll();

    return chats.map((chat) => chat.toPrimitives());
  }
}

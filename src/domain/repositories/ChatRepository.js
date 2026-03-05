/**
 * Repository Interface: ChatRepository
 * Define el contrato para persistir chats
 * Principio: Dependency Inversion - El dominio define la interfaz
 * Principio: Interface Segregation - Interfaz específica para chats
 */
export class ChatRepository {
  /**
   * Guarda un chat
   * @param {Chat} chat
   * @returns {Promise<void>}
   */
  async save(chat) {
    throw new Error("Método save() debe ser implementado");
  }

  /**
   * Encuentra un chat por ID
   * @param {ChatId} chatId
   * @returns {Promise<Chat|null>}
   */
  async findById(chatId) {
    throw new Error("Método findById() debe ser implementado");
  }

  /**
   * Obtiene todos los chats
   * @returns {Promise<Chat[]>}
   */
  async findAll() {
    throw new Error("Método findAll() debe ser implementado");
  }

  /**
   * Elimina un chat
   * @param {ChatId} chatId
   * @returns {Promise<void>}
   */
  async delete(chatId) {
    throw new Error("Método delete() debe ser implementado");
  }

  /**
   * Verifica si existe un chat
   * @param {ChatId} chatId
   * @returns {Promise<boolean>}
   */
  async exists(chatId) {
    throw new Error("Método exists() debe ser implementado");
  }
}

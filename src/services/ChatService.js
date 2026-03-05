import { Chat } from "../models/Chat.js";
import { Message } from "../models/Message.js";

/**
 * Servicio: ChatService
 * Gestiona toda la lógica de negocio relacionada con los chats.
 *
 * CAPA: Servicios (lógica de negocio)
 * RESPONSABILIDAD: Crear, obtener, eliminar chats y agregar mensajes.
 *
 * Almacena los chats en memoria usando un Map.
 * En un proyecto real se reemplazaría por una base de datos.
 */
export class ChatService {
  #chats = new Map();

  /**
   * Crea un nuevo chat y lo almacena.
   */
  create(model, title) {
    const chat = new Chat({ model, title });
    this.#chats.set(chat.id, chat);
    return chat;
  }

  /**
   * Busca un chat por su ID. Devuelve null si no existe.
   */
  getById(chatId) {
    return this.#chats.get(chatId) || null;
  }

  /**
   * Devuelve todos los chats almacenados.
   */
  getAll() {
    return Array.from(this.#chats.values());
  }

  /**
   * Elimina un chat por su ID. Lanza error si no existe.
   */
  delete(chatId) {
    if (!this.#chats.has(chatId)) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    this.#chats.delete(chatId);
  }

  /**
   * Agrega un mensaje a un chat existente.
   * Crea la instancia de Message y la añade al chat.
   */
  addMessage(chatId, role, content) {
    const chat = this.getById(chatId);
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }
    const message = new Message({ role, content });
    chat.addMessage(message);
    return message;
  }
}

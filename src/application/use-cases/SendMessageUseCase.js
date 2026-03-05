import { ChatId } from "../../domain/value-objects/ChatId.js";
import { Message } from "../../domain/entities/Message.js";
import { MessageId } from "../../domain/value-objects/MessageId.js";
import { MessageRole } from "../../domain/value-objects/MessageRole.js";

/**
 * Use Case: SendMessage
 * Caso de uso para enviar un mensaje y obtener respuesta de la IA
 * Principio: Single Responsibility - Solo maneja el flujo de envío de mensajes
 */
export class SendMessageUseCase {
  #chatRepository;
  #aiProvider;

  constructor(chatRepository, aiProvider) {
    this.#chatRepository = chatRepository;
    this.#aiProvider = aiProvider;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params
   * @param {string} params.chatId - ID del chat
   * @param {string} params.content - Contenido del mensaje
   * @param {string} params.ollamaUrl - URL de Ollama
   * @param {Function} params.onChunk - Callback para streaming
   * @returns {Promise<Object>} Respuesta completa
   */
  async execute({ chatId, content, ollamaUrl, onChunk }) {
    // Validar entrada
    if (!chatId || !content) {
      throw new Error("chatId y content son requeridos");
    }

    // Obtener chat
    const chat = await this.#chatRepository.findById(new ChatId(chatId));
    if (!chat) {
      throw new Error(`Chat con ID ${chatId} no encontrado`);
    }

    // Crear mensaje del usuario
    const userMessage = new Message(
      MessageId.generate(),
      MessageRole.USER,
      content,
    );

    // Agregar mensaje del usuario al chat
    chat.addMessage(userMessage);

    // Obtener respuesta de la IA
    const history = chat.getOllamaHistory();
    const responseContent = await this.#aiProvider.sendMessage(
      chat.model.value,
      history,
      ollamaUrl || "http://localhost:11434",
      onChunk,
    );

    // Crear mensaje del asistente
    const assistantMessage = new Message(
      MessageId.generate(),
      MessageRole.ASSISTANT,
      responseContent,
    );

    // Agregar respuesta al chat
    chat.addMessage(assistantMessage);

    // Guardar chat actualizado
    await this.#chatRepository.save(chat);

    // Retornar DTO
    return {
      userMessage: userMessage.toPrimitives(),
      assistantMessage: assistantMessage.toPrimitives(),
      chat: chat.toPrimitives(),
    };
  }
}

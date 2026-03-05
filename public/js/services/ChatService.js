/**
 * Service: ChatService
 * Servicio para comunicación con la API de chats
 * Principio: Single Responsibility - Solo maneja comunicación HTTP de chats
 */
export class ChatService {
  #baseUrl;

  constructor(baseUrl = "/api") {
    this.#baseUrl = baseUrl;
  }

  /**
   * Crea un nuevo chat
   */
  async createChat(model, title) {
    const response = await fetch(`${this.#baseUrl}/new-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, title }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear chat");
    }

    return response.json();
  }

  /**
   * Envía un mensaje con streaming
   */
  async sendMessage(chatId, content, ollamaUrl, onChunk, onComplete, onError) {
    try {
      const response = await fetch(`${this.#baseUrl}/chat/${chatId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, ollamaUrl }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              onError(data.error);
              return;
            }

            if (data.chunk) {
              onChunk(data.chunk);
            }

            if (data.done) {
              onComplete(data.fullResponse);
            }
          }
        }
      }
    } catch (error) {
      onError(error.message);
    }
  }

  /**
   * Obtiene todos los chats
   */
  async getAllChats() {
    const response = await fetch(`${this.#baseUrl}/chats`);

    if (!response.ok) {
      throw new Error("Error al obtener chats");
    }

    return response.json();
  }

  /**
   * Obtiene un chat específico
   */
  async getChatById(chatId) {
    const response = await fetch(`${this.#baseUrl}/chats/${chatId}`);

    if (!response.ok) {
      throw new Error("Error al obtener chat");
    }

    return response.json();
  }
}

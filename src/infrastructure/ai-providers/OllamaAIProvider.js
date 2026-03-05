import { AIProvider } from "../../domain/repositories/AIProvider.js";
import ollama from "ollama";

/**
 * Infrastructure: OllamaAIProvider
 * Implementación concreta del proveedor de IA usando Ollama
 * Principio: Dependency Inversion - Implementa la interfaz del dominio
 */
export class OllamaAIProvider extends AIProvider {
  /**
   * Obtiene lista de modelos disponibles
   */
  async listModels(url) {
    try {
      const response = await ollama.list({ host: url });

      if (!response || !response.models) {
        return [];
      }

      return response.models.map((model) => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at,
      }));
    } catch (error) {
      throw new Error(`Error al obtener modelos de Ollama: ${error.message}`);
    }
  }

  /**
   * Envía mensaje y recibe respuesta en streaming
   */
  async sendMessage(model, messages, url, onChunk) {
    try {
      const response = await ollama.chat({
        model,
        messages,
        stream: true,
        host: url,
      });

      let fullResponse = "";

      for await (const part of response) {
        const content = part.message.content;
        fullResponse += content;

        if (onChunk) {
          onChunk(content);
        }
      }

      return fullResponse;
    } catch (error) {
      throw new Error(`Error al enviar mensaje a Ollama: ${error.message}`);
    }
  }
}

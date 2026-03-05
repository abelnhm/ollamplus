import ollama from "ollama";

/**
 * Servicio: OllamaService
 * Se comunica con la API de Ollama para obtener modelos y enviar mensajes.
 *
 * CAPA: Servicios (lógica de negocio / integración externa)
 * RESPONSABILIDAD: Encapsular toda la comunicación con Ollama.
 *
 * Ollama es un servidor local que ejecuta modelos de IA.
 * Este servicio usa la librería 'ollama' de npm para interactuar con él.
 */
export class OllamaService {
  /**
   * Obtiene la lista de modelos instalados en Ollama.
   * @param {string} url - URL donde corre Ollama (ej: "http://localhost:11434")
   * @returns {Promise<Array>} Lista de modelos con nombre, tamaño y fecha
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
   * Envía un mensaje al modelo y recibe la respuesta en streaming.
   *
   * El streaming permite mostrar la respuesta palabra por palabra en la UI,
   * en lugar de esperar a que se genere toda la respuesta completa.
   *
   * @param {string} model - Nombre del modelo (ej: "llama2")
   * @param {Array} messages - Historial de mensajes [{role, content}]
   * @param {string} url - URL de Ollama
   * @param {Function} onChunk - Callback que se ejecuta por cada fragmento recibido
   * @returns {Promise<string>} Respuesta completa
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

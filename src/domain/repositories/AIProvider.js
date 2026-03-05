/**
 * Service Interface: AIProvider
 * Define el contrato para servicios de IA
 * Principio: Dependency Inversion - El dominio no depende de implementaciones concretas
 */
export class AIProvider {
  /**
   * Obtiene una lista de modelos disponibles
   * @param {string} url - URL del proveedor
   * @returns {Promise<Array>}
   */
  async listModels(url) {
    throw new Error("Método listModels() debe ser implementado");
  }

  /**
   * Envía un mensaje y recibe respuesta en streaming
   * @param {string} model - Nombre del modelo
   * @param {Array} messages - Historial de mensajes
   * @param {string} url - URL del proveedor
   * @param {Function} onChunk - Callback para cada fragmento de respuesta
   * @returns {Promise<string>}
   */
  async sendMessage(model, messages, url, onChunk) {
    throw new Error("Método sendMessage() debe ser implementado");
  }
}

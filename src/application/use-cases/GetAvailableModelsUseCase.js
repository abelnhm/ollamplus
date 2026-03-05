/**
 * Use Case: GetAvailableModels
 * Caso de uso para obtener modelos disponibles del proveedor de IA
 * Principio: Single Responsibility - Solo obtiene modelos
 */
export class GetAvailableModelsUseCase {
  #aiProvider;

  constructor(aiProvider) {
    this.#aiProvider = aiProvider;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params
   * @param {string} params.ollamaUrl - URL de Ollama
   * @returns {Promise<Array>} Lista de modelos disponibles
   */
  async execute({ ollamaUrl }) {
    // Validar URL
    if (!ollamaUrl) {
      throw new Error("ollamaUrl es requerido");
    }

    if (!ollamaUrl.startsWith("http://") && !ollamaUrl.startsWith("https://")) {
      throw new Error("La URL debe comenzar con http:// o https://");
    }

    // Obtener modelos del proveedor
    const models = await this.#aiProvider.listModels(ollamaUrl);

    // Transformar a formato DTO
    return models.map((model) => ({
      name: model.name,
      size: model.size,
      modified_at: model.modified_at,
    }));
  }
}

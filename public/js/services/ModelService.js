/**
 * Service: ModelService
 * Servicio para comunicación con la API de modelos
 * Principio: Single Responsibility - Solo maneja comunicación HTTP de modelos
 */
export class ModelService {
  #baseUrl;

  constructor(baseUrl = "/api") {
    this.#baseUrl = baseUrl;
  }

  /**
   * Obtiene modelos disponibles
   */
  async getAvailableModels(ollamaUrl = "http://localhost:11434") {
    const response = await fetch(`${this.#baseUrl}/models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ollamaUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al obtener modelos");
    }

    return response.json();
  }
}

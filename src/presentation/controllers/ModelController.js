/**
 * Presentation: ModelController
 * Controlador HTTP para operaciones de modelos de IA
 * Principio: Single Responsibility - Solo maneja HTTP para modelos
 */
export class ModelController {
  #getAvailableModelsUseCase;

  constructor(getAvailableModelsUseCase) {
    this.#getAvailableModelsUseCase = getAvailableModelsUseCase;
  }

  /**
   * POST /api/models
   * Obtiene modelos disponibles
   */
  getModels = async (req, res) => {
    try {
      const { ollamaUrl = "http://localhost:11434" } = req.body;

      const models = await this.#getAvailableModelsUseCase.execute({
        ollamaUrl,
      });

      res.json({ models });
    } catch (error) {
      console.error("❌ Error al obtener modelos:", error.message);

      let errorMessage = error.message;
      let details = "Asegúrate de que Ollama esté corriendo (ollama serve)";

      if (
        error.message.includes("JSON") ||
        error.message.includes("<!DOCTYPE")
      ) {
        errorMessage =
          "URL incorrecta o Ollama no está disponible en esa dirección";
        details =
          "Verifica que la URL sea correcta (ej: http://192.168.1.100:11434)";
      }

      res.status(500).json({
        error: errorMessage,
        details,
      });
    }
  };
}

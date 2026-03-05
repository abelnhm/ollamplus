import { Router } from "express";

/**
 * Rutas: Modelos
 * Define los endpoints HTTP para operaciones de modelos de IA.
 *
 * CAPA: Rutas (presentación / HTTP)
 * RESPONSABILIDAD: Recibir peticiones HTTP relacionadas con modelos
 *                  y devolver la lista de modelos disponibles.
 *
 * Endpoints:
 *   POST /api/models → Obtener modelos disponibles en Ollama
 */
export function createModelRoutes(ollamaService) {
  const router = Router();

  // Obtener modelos disponibles
  router.post("/models", async (req, res) => {
    try {
      const { ollamaUrl = "http://localhost:11434" } = req.body;

      if (
        !ollamaUrl.startsWith("http://") &&
        !ollamaUrl.startsWith("https://")
      ) {
        return res
          .status(400)
          .json({ error: "La URL debe comenzar con http:// o https://" });
      }

      const models = await ollamaService.listModels(ollamaUrl);
      res.json({ models });
    } catch (error) {
      console.error("Error al obtener modelos:", error.message);

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

      res.status(500).json({ error: errorMessage, details });
    }
  });

  return router;
}

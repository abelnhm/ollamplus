import { Router, Request, Response } from "express";
import { OllamaService } from "../services/OllamaService.js";

/**
 * Rutas: Modelos
 * Define los endpoints HTTP para operaciones de modelos de IA.
 *
 * Endpoints:
 *   POST /api/models → Obtener modelos disponibles en Ollama
 */
export function createModelRoutes(ollamaService: OllamaService): Router {
  const router = Router();

  // Obtener modelos disponibles
  router.post("/models", async (req: Request, res: Response) => {
    try {
      const { ollamaUrl = "http://localhost:11434" } = req.body;

      if (
        !ollamaUrl.startsWith("http://") &&
        !ollamaUrl.startsWith("https://")
      ) {
        res
          .status(400)
          .json({ error: "La URL debe comenzar con http:// o https://" });
        return;
      }

      const models = await ollamaService.listModels(ollamaUrl);
      res.json({ models });
    } catch (error) {
      console.error("Error al obtener modelos:", (error as Error).message);

      let errorMessage = (error as Error).message;
      let details = "Asegúrate de que Ollama esté corriendo (ollama serve)";

      if (errorMessage.includes("JSON") || errorMessage.includes("<!DOCTYPE")) {
        errorMessage =
          "URL incorrecta o Ollama no está disponible en esa dirección";
        details =
          "Verifica que la URL sea correcta (ej: http://192.168.1.100:11434)";
      }

      res.status(500).json({ error: errorMessage, details });
    }
  });

  // Obtener información detallada de un modelo
  router.post("/model-info", async (req: Request, res: Response) => {
    try {
      const { ollamaUrl = "http://localhost:11434", model } = req.body;

      if (!model) {
        res.status(400).json({ error: "Se requiere el nombre del modelo" });
        return;
      }

      if (
        !ollamaUrl.startsWith("http://") &&
        !ollamaUrl.startsWith("https://")
      ) {
        res
          .status(400)
          .json({ error: "La URL debe comenzar con http:// o https://" });
        return;
      }

      const info = await ollamaService.showModel(ollamaUrl, model);
      res.json({ info });
    } catch (error) {
      console.error("Error al obtener info del modelo:", (error as Error).message);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}

import express from "express";

/**
 * Presentation: ModelRoutes
 * Define las rutas HTTP para modelos
 */
export function createModelRoutes(modelController) {
  const router = express.Router();

  router.post("/models", modelController.getModels);

  return router;
}

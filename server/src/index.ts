import express, { Express } from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { config_ } from "./config.js";
import { logger, expressLogger } from "./middlewares/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { ChatService } from "./services/ChatService.js";
import { OllamaService } from "./services/OllamaService.js";
import { createChatRoutes } from "./routes/chatRoutes.js";
import { createModelRoutes } from "./routes/modelRoutes.js";

/**
 * Servidor: createServer
 * Configura y arranca el servidor Express con todas sus capas conectadas.
 *
 * Aquí se "cablea" todo el proyecto:
 *   1. Se crean los servicios (lógica de negocio)
 *   2. Se crean las rutas pasándoles los servicios que necesitan
 *   3. Se registran middlewares, rutas y manejo de errores
 *   4. Se inicia el servidor HTTP
 */
export function createServer(port: number = config_.port): Express {
  const app = express();

  // --- Security Headers ---
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // --- Middlewares generales ---
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(expressLogger);

  // --- Archivos estáticos (frontend, sin caché en desarrollo) ---
  app.use(
    express.static(join(__dirname, "..", "..", "public"), {
      etag: false,
      lastModified: false,
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "no-store");
      },
    }),
  );

  // --- Capa de servicios (lógica de negocio) ---
  const chatService = new ChatService();
  const ollamaService = new OllamaService();

  // --- Capa de rutas (presentación HTTP) ---
  app.use("/api", createChatRoutes(chatService, ollamaService));
  app.use("/api", createModelRoutes(ollamaService));

  // --- Manejo de errores (siempre al final) ---
  app.use(errorHandler);

  // --- Iniciar servidor ---
  app.listen(port, () => {
    logger.info({ port }, "Servidor iniciado");
  });

  return app;
}

createServer();

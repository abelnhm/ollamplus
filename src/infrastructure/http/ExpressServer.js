import express from "express";
import cors from "cors";
import { logger } from "../../presentation/middlewares/logger.js";
import { errorHandler } from "../../presentation/middlewares/errorHandler.js";

/**
 * Infrastructure: ExpressServer
 * Configuración del servidor HTTP con Express
 * Principio: Single Responsibility - Solo configura el servidor HTTP
 */
export class ExpressServer {
  #app;
  #port;

  constructor(port = 3000) {
    this.#app = express();
    this.#port = port;
    this.#configureMiddlewares();
  }

  #configureMiddlewares() {
    // Middlewares básicos
    this.#app.use(cors());
    this.#app.use(express.json());
    this.#app.use(logger);

    // Servir archivos estáticos
    this.#app.use(express.static("public"));
  }

  /**
   * Registra rutas en el servidor
   */
  registerRoutes(basePath, router) {
    this.#app.use(basePath, router);
  }

  /**
   * Registra el middleware de manejo de errores
   * Debe ser el último middleware registrado
   */
  registerErrorHandler() {
    this.#app.use(errorHandler);
  }

  /**
   * Inicia el servidor
   */
  start() {
    this.#app.listen(this.#port, () => {
      console.log(`🚀 Servidor iniciado en http://localhost:${this.#port}`);
      console.log(`📝 Abre tu navegador en http://localhost:${this.#port}`);
    });
  }

  /**
   * Obtiene la instancia de Express (útil para testing)
   */
  getApp() {
    return this.#app;
  }
}

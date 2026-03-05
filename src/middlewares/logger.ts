import { Request, Response, NextFunction } from "express";

/**
 * Middleware: Logger
 * Registra en consola cada petición HTTP que llega al servidor.
 *
 * Muestra: MÉTODO RUTA - CÓDIGO_ESTADO (duración en ms)
 * Ejemplo: GET /api/chats - 200 (15ms)
 */
export function logger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
    );
  });

  next();
}

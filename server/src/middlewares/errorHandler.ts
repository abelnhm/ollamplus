import { Request, Response, NextFunction } from "express";

/**
 * Middleware: Error Handler
 * Captura cualquier error no manejado y devuelve una respuesta JSON.
 *
 * Express identifica los middlewares de error porque tienen 4 parámetros:
 * (err, req, res, next).
 */
export function errorHandler(
  err: Error & { status?: number },
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
}

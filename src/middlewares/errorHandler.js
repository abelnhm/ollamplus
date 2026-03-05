/**
 * Middleware: Error Handler
 * Captura cualquier error no manejado y devuelve una respuesta JSON.
 *
 * IMPORTANTE: Este middleware DEBE registrarse como el ÚLTIMO middleware
 * en Express para que pueda capturar errores de todas las rutas anteriores.
 *
 * Express identifica los middlewares de error porque tienen 4 parámetros:
 * (err, req, res, next) en lugar de los 3 habituales (req, res, next).
 */
export function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
}

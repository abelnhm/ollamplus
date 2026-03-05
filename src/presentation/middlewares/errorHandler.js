/**
 * Presentation: ErrorHandler
 * Middleware para manejo centralizado de errores
 */
export function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

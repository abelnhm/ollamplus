/**
 * Presentation: Logger
 * Middleware para logging de peticiones HTTP
 */
export function logger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
    );
  });

  next();
}

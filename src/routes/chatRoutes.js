import { Router } from "express";

/**
 * Rutas: Chat
 * Define los endpoints HTTP para operaciones de chat.
 *
 * CAPA: Rutas (presentación / HTTP)
 * RESPONSABILIDAD: Recibir peticiones HTTP, llamar a los servicios
 *                  y devolver respuestas al cliente.
 *
 * Endpoints:
 *   POST   /api/new-chat              → Crear un chat nuevo
 *   POST   /api/chat/:chatId/message  → Enviar mensaje (streaming SSE)
 *   GET    /api/chats                 → Listar todos los chats
 *   GET    /api/chats/:chatId         → Obtener un chat por ID
 *   DELETE /api/chats/:chatId         → Eliminar un chat
 */
export function createChatRoutes(chatService, ollamaService) {
  const router = Router();

  // Crear un nuevo chat
  router.post("/new-chat", (req, res) => {
    try {
      const { model, title } = req.body;

      if (!model || !title) {
        return res.status(400).json({ error: "model y title son requeridos" });
      }

      const chat = chatService.create(model, title);
      res.json({ success: true, chat: chat.toJSON() });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Enviar un mensaje y recibir respuesta en streaming (SSE)
  router.post("/chat/:chatId/message", async (req, res) => {
    try {
      const { chatId } = req.params;
      const { content, ollamaUrl } = req.body;

      const chat = chatService.getById(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat no encontrado" });
      }

      // Configurar Server-Sent Events para streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Agregar mensaje del usuario al chat
      chatService.addMessage(chatId, "user", content);

      // Enviar historial al modelo y recibir respuesta en streaming
      const history = chat.getHistory();
      const fullResponse = await ollamaService.sendMessage(
        chat.model,
        history,
        ollamaUrl || "http://localhost:11434",
        (chunk) => {
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        },
      );

      // Guardar respuesta del asistente en el chat
      chatService.addMessage(chatId, "assistant", fullResponse);

      // Enviar señal de finalización
      res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });

  // Obtener todos los chats
  router.get("/chats", (req, res) => {
    try {
      const chats = chatService.getAll().map((chat) => chat.toJSON());
      res.json({ success: true, chats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Obtener un chat por ID
  router.get("/chats/:chatId", (req, res) => {
    try {
      const chat = chatService.getById(req.params.chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat no encontrado" });
      }
      res.json({ success: true, chat: chat.toJSON() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Eliminar un chat
  router.delete("/chats/:chatId", (req, res) => {
    try {
      chatService.delete(req.params.chatId);
      res.json({ success: true, message: "Chat eliminado" });
    } catch (error) {
      const status = error.message.includes("no encontrado") ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  return router;
}

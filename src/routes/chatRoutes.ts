import { Router, Request, Response } from "express";
import { ChatService } from "../services/ChatService.js";
import { OllamaService } from "../services/OllamaService.js";

/**
 * Rutas: Chat
 * Define los endpoints HTTP para operaciones de chat.
 *
 * Endpoints:
 *   POST   /api/new-chat              → Crear un chat nuevo
 *   POST   /api/chat/:chatId/message  → Enviar mensaje (streaming SSE)
 *   GET    /api/chats                 → Listar todos los chats
 *   GET    /api/chats/:chatId         → Obtener un chat por ID
 *   DELETE /api/chats/:chatId         → Eliminar un chat
 */
export function createChatRoutes(
  chatService: ChatService,
  ollamaService: OllamaService,
): Router {
  const router = Router();

  // Crear un nuevo chat
  router.post("/new-chat", (req: Request, res: Response) => {
    try {
      const { model, title } = req.body;

      if (!model || !title) {
        res.status(400).json({ error: "model y title son requeridos" });
        return;
      }

      const chat = chatService.create(model, title);
      res.json({ success: true, chat: chat.toJSON() });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Enviar un mensaje y recibir respuesta en streaming (SSE)
  router.post("/chat/:chatId/message", async (req: Request, res: Response) => {
    try {
      const chatId = req.params.chatId as string;
      const { content, ollamaUrl } = req.body;

      const chat = chatService.getById(chatId);
      if (!chat) {
        res.status(404).json({ error: "Chat no encontrado" });
        return;
      }

      // Configurar Server-Sent Events para streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Agregar mensaje del usuario al chat
      chatService.addMessage(chatId as string, "user", content);

      // Enviar historial al modelo y recibir respuesta en streaming
      const history = chat.getHistory();
      const fullResponse = await ollamaService.sendMessage(
        chat.model,
        history,
        ollamaUrl || "http://localhost:11434",
        (chunk: string) => {
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        },
      );

      // Guardar respuesta del asistente en el chat
      chatService.addMessage(chatId as string, "assistant", fullResponse);

      // Enviar señal de finalización
      res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
      res.end();
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({ error: (error as Error).message })}\n\n`,
      );
      res.end();
    }
  });

  // Obtener todos los chats
  router.get("/chats", (req: Request, res: Response) => {
    try {
      const chats = chatService.getAll().map((chat) => chat.toJSON());
      res.json({ success: true, chats });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Obtener un chat por ID
  router.get("/chats/:chatId", (req: Request, res: Response) => {
    try {
      const chat = chatService.getById(req.params.chatId as string);
      if (!chat) {
        res.status(404).json({ error: "Chat no encontrado" });
        return;
      }
      res.json({ success: true, chat: chat.toJSON() });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Eliminar un chat
  router.delete("/chats/:chatId", (req: Request, res: Response) => {
    try {
      chatService.delete(req.params.chatId as string);
      res.json({ success: true, message: "Chat eliminado" });
    } catch (error) {
      const status = (error as Error).message.includes("no encontrado")
        ? 404
        : 500;
      res.status(status).json({ error: (error as Error).message });
    }
  });

  return router;
}

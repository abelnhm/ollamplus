import { Router, Request, Response } from "express";
import { ChatService } from "../services/ChatService.js";
import { OllamaService } from "../services/OllamaService.js";

/**
 * Rutas: Chat
 * Define los endpoints HTTP para operaciones de chat.
 *
 * Endpoints:
 *   POST   /api/new-chat              -> Crear un chat nuevo
 *   POST   /api/chat/:chatId/message  -> Enviar mensaje (streaming SSE)
 *   GET    /api/chats                 -> Listar todos los chats
 *   GET    /api/chats/:chatId         -> Obtener un chat por ID
 *   DELETE /api/chats/:chatId         -> Eliminar un chat
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
      const { content, ollamaUrl, options, systemPrompt } = req.body;

      const chat = chatService.getById(chatId);
      if (!chat) {
        res.status(404).json({ error: "Chat no encontrado" });
        return;
      }

      // Configurar Server-Sent Events para streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Agregar mensaje del usuario al chat (solo si hay contenido; null en regeneracion)
      let userMessage: ReturnType<ChatService["addMessage"]> | null = null;
      if (content) {
        // Guardar en DB
        userMessage = chatService.addMessage(chatId as string, "user", content);
        // Agregar al objeto chat en memoria para que getHistory() lo incluya
        chat.addMessage(userMessage);
      }

      // Enviar historial al modelo y recibir respuesta en streaming
      const history = chat.getHistory();
      
      const result = await ollamaService.sendMessage(
        chat.model,
        history,
        ollamaUrl || "http://localhost:11434",
        (chunk: string) => {
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        },
        options,
        systemPrompt,
      );

      // Si la respuesta es vacía, usar texto alternativo
      const safeResponse =
        result.response && result.response.trim()
          ? result.response
          : "No se pudo generar respuesta.";

      // Guardar respuesta del asistente en el chat junto a sus métricas
      const assistantMessage = chatService.addMessage(
        chatId as string,
        "assistant",
        safeResponse,
        {
          tokenCount: result.responseTokens,
          durationMs: result.totalDurationMs,
          tokensPerSecond: result.tokensPerSecond,
        },
      );

      // Enviar señal de finalización con token usage
      res.write(
        `data: ${JSON.stringify({
          done: true,
          fullResponse: safeResponse,
          userMessageId: userMessage?.id || null,
          userMessage: userMessage?.toJSON() || null,
          assistantMessage: assistantMessage.toJSON(),
          tokenUsage: {
            promptTokens: result.promptTokens,
            responseTokens: result.responseTokens,
            totalTokens: result.promptTokens + result.responseTokens,
          },
        })}\n\n`,
      );
      res.end();
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({ error: (error as Error).message })}\n\n`,
      );
      res.end();
    }
  });

  // Buscar chats por titulo o contenido de mensajes
  router.get("/chats/search", (req: Request, res: Response) => {
    try {
      const q = ((req.query.q as string) || "").trim();
      if (!q) {
        res.status(400).json({ error: "El parametro 'q' es requerido" });
        return;
      }
      const chats = chatService.search(q).map((chat) => chat.toJSON());
      res.json({ success: true, chats });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
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

  // Alternar pin/anclar un chat
  router.patch("/chats/:chatId/pin", (req: Request, res: Response) => {
    try {
      const chat = chatService.togglePin(req.params.chatId as string);
      res.json({ success: true, chat: chat.toJSON() });
    } catch (error) {
      const status = (error as Error).message.includes("no encontrado")
        ? 404
        : 500;
      res.status(status).json({ error: (error as Error).message });
    }
  });

  // Renombrar un chat
  router.patch("/chats/:chatId", (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      if (!title || !title.trim()) {
        res.status(400).json({ error: "El titulo es requerido" });
        return;
      }
      const chat = chatService.rename(
        req.params.chatId as string,
        title.trim(),
      );
      res.json({ success: true, chat: chat.toJSON() });
    } catch (error) {
      const status = (error as Error).message.includes("no encontrado")
        ? 404
        : 500;
      res.status(status).json({ error: (error as Error).message });
    }
  });

  // Cambiar el modelo de un chat
  router.patch("/chats/:chatId/model", (req: Request, res: Response) => {
    try {
      const { model } = req.body;
      if (!model || !model.trim()) {
        res.status(400).json({ error: "El modelo es requerido" });
        return;
      }
      const chat = chatService.changeModel(
        req.params.chatId as string,
        model.trim(),
      );
      res.json({ success: true, chat: chat.toJSON() });
    } catch (error) {
      const status = (error as Error).message.includes("no encontrado")
        ? 404
        : 500;
      res.status(status).json({ error: (error as Error).message });
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

  // Eliminar el ultimo mensaje de un chat (para regenerar respuesta)
  router.delete(
    "/chats/:chatId/last-message",
    (req: Request, res: Response) => {
      try {
        const chat = chatService.getById(req.params.chatId as string);
        if (!chat) {
          res.status(404).json({ error: "Chat no encontrado" });
          return;
        }
        chatService.removeLastMessage(req.params.chatId as string);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Contar tokens del historial de un chat con el modelo cargado
  router.post(
    "/chat/:chatId/count-tokens",
    async (req: Request, res: Response) => {
      try {
        const chat = chatService.getById(req.params.chatId as string);
        if (!chat) {
          res.status(404).json({ error: "Chat no encontrado" });
          return;
        }

        const { ollamaUrl, systemPrompt } = req.body;
        const history = chat.getHistory();

        const result = await ollamaService.countTokens(
          chat.model,
          history,
          ollamaUrl || "http://localhost:11434",
          systemPrompt,
        );

        res.json({
          success: true,
          promptTokens: result.promptTokens,
        });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Importar una conversacion
  router.post("/import-chat", (req: Request, res: Response) => {
    try {
      const { model, title, messages } = req.body;

      if (!model || !title || !Array.isArray(messages)) {
        res
          .status(400)
          .json({ error: "model, title y messages son requeridos" });
        return;
      }

      const chat = chatService.create(model, title);

      for (const msg of messages) {
        if (!msg.role || !msg.content) continue;
        chatService.addMessage(chat.id, msg.role, msg.content);
      }

      res.json({ success: true, chat: chat.toJSON() });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Truncar historial en un mensaje y actualizar su contenido (edicion)
  router.put(
    "/chats/:chatId/messages/:msgId",
    (req: Request, res: Response) => {
      try {
        const { content } = req.body;
        if (!content || !content.trim()) {
          res.status(400).json({ error: "El contenido es requerido" });
          return;
        }
        const message = chatService.truncateAtMessage(
          req.params.chatId as string,
          req.params.msgId as string,
          content.trim(),
        );
        res.json({ success: true, message: message.toJSON() });
      } catch (error) {
        const status = (error as Error).message.includes("no encontrado")
          ? 404
          : 500;
        res.status(status).json({ error: (error as Error).message });
      }
    },
  );

  return router;
}

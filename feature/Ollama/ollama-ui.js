import ollama from "ollama";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

export class OllamaChat {
  constructor(model = null, ollamaUrl = null) {
    this.conversationHistory = [];
    this.model = model || process.env.OLLAMA_MODEL;
    this.ollamaUrl = ollamaUrl || "http://localhost:11434";
  }

  async sendMessage(userMessage, streamCallback = null) {
    // Agregar mensaje del usuario al historial
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    const response = await ollama.chat({
      model: this.model,
      messages: this.conversationHistory,
      stream: true,
      host: this.ollamaUrl,
    });

    let fullResponse = "";

    // Streaming con callback
    for await (const part of response) {
      const content = part.message.content;
      fullResponse += content;

      if (streamCallback) {
        streamCallback(content);
      } else {
        process.stdout.write(content);
      }
    }

    if (!streamCallback) {
      console.log("\n");
    }

    // Agregar respuesta del asistente al historial
    this.conversationHistory.push({
      role: "assistant",
      content: fullResponse,
    });

    return fullResponse;
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

// Servidor web para la interfaz de chat
export function startChatServer(port = 3000) {
  const app = express();
  const sessions = new Map();
  const chatsMetadata = new Map(); // Almacenar metadata de chats

  app.use(cors());
  app.use(express.json());
  app.use(express.static("public"));

  // Endpoint para listar modelos disponibles
  app.post("/api/models", async (req, res) => {
    try {
      const { ollamaUrl = "http://localhost:11434" } = req.body;
      console.log(
        `📋 Solicitando lista de modelos de Ollama desde ${ollamaUrl}...`,
      );

      // Validar que la URL sea válida
      if (
        !ollamaUrl.startsWith("http://") &&
        !ollamaUrl.startsWith("https://")
      ) {
        throw new Error("La URL debe comenzar con http:// o https://");
      }

      const response = await ollama.list({ host: ollamaUrl });
      console.log("✅ Respuesta de Ollama recibida:", response);

      if (!response || !response.models) {
        console.warn("⚠️ Respuesta de Ollama sin modelos");
        return res.json({ models: [] });
      }

      const models = response.models.map((model) => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at,
      }));

      console.log(`✅ ${models.length} modelo(s) encontrado(s)`);
      res.json({ models });
    } catch (error) {
      console.error("❌ Error al obtener modelos de Ollama:", error.message);
      console.error("Stack:", error.stack);

      let errorMessage = error.message;
      let details = "Asegúrate de que Ollama esté corriendo (ollama serve)";

      if (
        error.message.includes("JSON") ||
        error.message.includes("<!DOCTYPE")
      ) {
        errorMessage =
          "URL incorrecta o Ollama no está disponible en esa dirección";
        details =
          "Verifica que la URL sea correcta (ej: http://192.168.1.100:11434) y que Ollama esté ejecutándose en esa máquina";
      }

      res.status(500).json({
        error: errorMessage,
        details: details,
      });
    }
  });

  // Endpoint para crear nueva conversación con modelo específico
  app.post("/api/new-chat", (req, res) => {
    const { sessionId, model, title, ollamaUrl } = req.body;
    if (!sessionId || !model) {
      return res
        .status(400)
        .json({ error: "sessionId y model son requeridos" });
    }

    // Crear chat
    sessions.set(sessionId, new OllamaChat(model, ollamaUrl));

    // Guardar metadata
    chatsMetadata.set(sessionId, {
      id: sessionId,
      model: model,
      title: title || `Chat con ${model}`,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messageCount: 0,
    });

    res.json({ success: true, sessionId, model });
  });

  // Endpoint para listar todos los chats
  app.get("/api/chats", (req, res) => {
    const chatsList = Array.from(chatsMetadata.values()).map((metadata) => {
      const session = sessions.get(metadata.id);
      return {
        ...metadata,
        messageCount: session ? session.conversationHistory.length : 0,
      };
    });

    // Ordenar por última actividad
    chatsList.sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
    );

    res.json({ success: true, chats: chatsList });
  });

  // Endpoint para obtener un chat específico
  app.get("/api/chats/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const metadata = chatsMetadata.get(sessionId);
    const session = sessions.get(sessionId);

    if (!metadata || !session) {
      return res.status(404).json({ error: "Chat no encontrado" });
    }

    res.json({
      success: true,
      chat: {
        ...metadata,
        history: session.conversationHistory,
        messageCount: session.conversationHistory.length,
      },
    });
  });

  // Endpoint para eliminar un chat
  app.delete("/api/chats/:sessionId", (req, res) => {
    const { sessionId } = req.params;

    if (!chatsMetadata.has(sessionId)) {
      return res.status(404).json({ error: "Chat no encontrado" });
    }

    sessions.delete(sessionId);
    chatsMetadata.delete(sessionId);

    res.json({ success: true, message: "Chat eliminado" });
  });

  // Endpoint para actualizar título de chat
  app.patch("/api/chats/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const { title } = req.body;

    const metadata = chatsMetadata.get(sessionId);
    if (!metadata) {
      return res.status(404).json({ error: "Chat no encontrado" });
    }

    metadata.title = title;
    chatsMetadata.set(sessionId, metadata);

    res.json({ success: true, metadata });
  });

  // Endpoint para enviar mensajes
  app.post("/api/chat", async (req, res) => {
    const { message, sessionId = "default", model, ollamaUrl } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensaje requerido" });
    }

    // Crear o recuperar sesión
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, new OllamaChat(model, ollamaUrl));
    }

    const chat = sessions.get(sessionId);

    // Configurar SSE (Server-Sent Events) para streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      await chat.sendMessage(message, (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });

      // Actualizar metadata del chat
      const metadata = chatsMetadata.get(sessionId);
      if (metadata) {
        metadata.lastMessageAt = new Date().toISOString();
        metadata.messageCount = chat.conversationHistory.length;

        // Si es el primer mensaje del usuario, actualizar el título
        if (
          metadata.messageCount === 2 &&
          metadata.title.startsWith("Chat con")
        ) {
          // Generar título desde el primer mensaje del usuario (máximo 40 caracteres)
          const firstUserMessage = chat.conversationHistory[0]?.content || "";
          metadata.title =
            firstUserMessage.length > 40
              ? firstUserMessage.substring(0, 40) + "..."
              : firstUserMessage;
        }

        chatsMetadata.set(sessionId, metadata);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });

  // Endpoint para limpiar historial
  app.post("/api/clear", (req, res) => {
    const { sessionId = "default" } = req.body;
    if (sessions.has(sessionId)) {
      sessions.get(sessionId).clearHistory();
    }
    res.json({ success: true });
  });

  // Endpoint para obtener historial
  app.get("/api/history", (req, res) => {
    const sessionId = req.query.sessionId || "default";
    const chat = sessions.get(sessionId);
    res.json({
      history: chat ? chat.conversationHistory : [],
    });
  });

  app.listen(port, () => {
    console.log(`🚀 Servidor de chat iniciado en http://localhost:${port}`);
    console.log(
      `📝 Abre tu navegador en http://localhost:${port} para chatear`,
    );
  });

  return app;
}
export async function startInteractiveChat() {
  const chat = new OllamaChat();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Chat iniciado. Escribe 'salir' para terminar.\n");

  const askQuestion = () => {
    rl.question("Tú: ", async (input) => {
      if (input.toLowerCase() === "salir") {
        console.log("¡Hasta luego!");
        rl.close();
        return;
      }

      process.stdout.write("Asistente: ");
      await chat.sendMessage(input);

      askQuestion(); // Continuar la conversación
    });
  };

  askQuestion();
}

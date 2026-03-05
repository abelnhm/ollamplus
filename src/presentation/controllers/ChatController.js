/**
 * Presentation: ChatController
 * Controlador HTTP para operaciones de chat
 * Principio: Single Responsibility - Solo maneja HTTP para chats
 */
export class ChatController {
  #createChatUseCase;
  #sendMessageUseCase;
  #getAllChatsUseCase;
  #getChatByIdUseCase;
  #deleteChatUseCase;

  constructor(
    createChatUseCase,
    sendMessageUseCase,
    getAllChatsUseCase,
    getChatByIdUseCase,
    deleteChatUseCase,
  ) {
    this.#createChatUseCase = createChatUseCase;
    this.#sendMessageUseCase = sendMessageUseCase;
    this.#getAllChatsUseCase = getAllChatsUseCase;
    this.#getChatByIdUseCase = getChatByIdUseCase;
    this.#deleteChatUseCase = deleteChatUseCase;
  }

  /**
   * POST /api/new-chat
   * Crea un nuevo chat
   */
  createChat = async (req, res) => {
    try {
      const { model, title } = req.body;

      const chat = await this.#createChatUseCase.execute({ model, title });

      res.json({
        success: true,
        chat,
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  };

  /**
   * POST /api/chat/:chatId/message
   * Envía un mensaje en un chat
   */
  sendMessage = async (req, res) => {
    try {
      const { chatId } = req.params;
      const { content, ollamaUrl } = req.body;

      // Configurar streaming con Server-Sent Events
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";

      await this.#sendMessageUseCase.execute({
        chatId,
        content,
        ollamaUrl,
        onChunk: (chunk) => {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        },
      });

      // Enviar mensaje final
      res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  };

  /**
   * GET /api/chats
   * Obtiene todos los chats
   */
  getAllChats = async (req, res) => {
    try {
      const chats = await this.#getAllChatsUseCase.execute();

      res.json({ success: true, chats });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  };

  /**
   * GET /api/chats/:chatId
   * Obtiene un chat específico
   */
  getChatById = async (req, res) => {
    try {
      const { chatId } = req.params;

      const chat = await this.#getChatByIdUseCase.execute({ chatId });

      if (!chat) {
        return res.status(404).json({
          error: "Chat no encontrado",
        });
      }

      res.json({ success: true, chat });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  };

  /**
   * DELETE /api/chats/:chatId
   * Elimina un chat
   */
  deleteChat = async (req, res) => {
    try {
      const { chatId } = req.params;
      await this.#deleteChatUseCase.execute({ chatId });
      res.json({ success: true, message: "Chat eliminado" });
    } catch (error) {
      const status = error.message.includes("no encontrado") ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  };
}

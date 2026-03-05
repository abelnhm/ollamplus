import express from "express";

/**
 * Presentation: ChatRoutes
 * Define las rutas HTTP para chats
 * Principio: Open/Closed - Abierto para extensión, cerrado para modificación
 */
export function createChatRoutes(chatController) {
  const router = express.Router();

  router.post("/new-chat", chatController.createChat);
  router.post("/chat/:chatId/message", chatController.sendMessage);
  router.get("/chats", chatController.getAllChats);
  router.get("/chats/:chatId", chatController.getChatById);
  router.delete("/chats/:chatId", chatController.deleteChat);

  return router;
}

import { MarkdownRenderer } from "../utils/MarkdownRenderer.js";

/**
 * UI Component: ChatUI
 * Gestiona la interfaz de usuario del chat
 * Principio: Single Responsibility - Solo maneja la UI del chat
 */
export class ChatUI {
  #chatMessages;
  #markdownRenderer;

  constructor(chatMessagesElement) {
    this.#chatMessages = chatMessagesElement;
    this.#markdownRenderer = new MarkdownRenderer();
  }

  /**
   * Agrega un mensaje a la UI
   */
  addMessage(role, content) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.innerHTML = this.#markdownRenderer.render(content);

    messageDiv.appendChild(contentDiv);
    this.#chatMessages.appendChild(messageDiv);

    this.scrollToBottom();
    return contentDiv;
  }

  /**
   * Actualiza el contenido de un elemento
   */
  updateContent(element, content) {
    element.innerHTML = this.#markdownRenderer.render(content);
  }

  /**
   * Limpia todos los mensajes
   */
  clearMessages() {
    this.#chatMessages.innerHTML = "";
  }

  /**
   * Hace scroll hasta el final
   */
  scrollToBottom() {
    this.#chatMessages.scrollTop = this.#chatMessages.scrollHeight;
  }

  /**
   * Muestra un mensaje de error
   */
  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "message error";
    errorDiv.innerHTML = `<div class="message-content">❌ ${message}</div>`;
    this.#chatMessages.appendChild(errorDiv);
    this.scrollToBottom();
  }
}

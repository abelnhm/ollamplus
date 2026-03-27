import { state } from "../state.js";
import type { ChatJSON, MessageJSON } from "../types.js";
import { apiPost, apiGet, apiDelete, apiPatch, apiPut } from "../api.js";
import {
  getOllamaUrl,
  escapeHtml,
  formatMarkdown,
  estimateTokensFromText,
} from "../utils.js";
import {
  chatMessages,
  messageInput,
  sendBtn,
  sendText,
  stopBtn,
  modelSelector,
  modelChangeModal,
  modelChangeModalText,
  chatsList,
  chatSearchInput,
  deleteChatModal,
  modelInfoPanel,
} from "../ui/elements.js";
import {
  addMessageToUI,
  createStreamingMessage,
  updateStreamingMessage,
  addCopyButton,
  addRegenerateButton,
  addEditButton,
  updateMessageMetadata,
  type MessageRenderMeta,
} from "../ui/messages.js";
import { closeSidebar } from "../ui/sidebar.js";
import {
  updateTokenUsage,
  resetTokenUsage,
  countChatTokens,
} from "./tokenService.js";
import { loadModelInfo } from "./modelService.js";
import { getModelOptions } from "./modelParams.js";
import { getSystemPrompt } from "./systemPrompt.js";
import { speakText } from "./ttsService.js";
import {
  formatFileContentForPrompt,
  formatFileContentForDisplay,
  clearAttachedFile,
  getAttachedFile,
} from "./fileAttachment.js";

// ==================================== Streaming helpers ====================================
function startStreamingUI(): void {
  state.isStreaming = true;
  state.abortController = new AbortController();
  sendBtn.disabled = true;
  sendBtn.style.display = "none";
  stopBtn.style.display = "flex";
  sendBtn.classList.add("loading");
  sendText.textContent = "Pensando...";
}

function endStreamingUI(streamWrapper: HTMLDivElement): void {
  state.isStreaming = false;
  state.abortController = null;
  sendBtn.disabled = false;
  sendBtn.style.display = "";
  stopBtn.style.display = "none";
  sendBtn.classList.remove("loading");
  sendText.textContent = "Enviar";
  addCopyButton(streamWrapper);
  addRegenerateButton(streamWrapper);
  refreshChatList();
}

interface SSEResult {
  fullText: string;
  tokenUsage?: {
    promptTokens: number;
    responseTokens: number;
    totalTokens?: number;
  };
  userMessageId?: string;
  userMessage?: MessageJSON | null;
  assistantMessage?: MessageJSON | null;
}

function buildAssistantFallbackMeta(
  result: SSEResult,
  startedAtMs: number,
): MessageRenderMeta {
  const durationMs = Math.max(Date.now() - startedAtMs, 0);
  const responseTokens = result.tokenUsage?.responseTokens;
  const speed =
    typeof responseTokens === "number" && durationMs > 0
      ? responseTokens / (durationMs / 1000)
      : undefined;

  return {
    timestamp: new Date().toISOString(),
    metrics: {
      tokenCount: responseTokens,
      durationMs,
      tokensPerSecond: speed,
    },
  };
}

async function readSSEStream(
  chatId: string,
  content: string | null,
  streamWrapper: HTMLDivElement,
  signal: AbortSignal,
): Promise<SSEResult> {
  let fullText = "";
  let tokenUsage: SSEResult["tokenUsage"];
  let userMessageId: string | undefined;
  let userMessage: MessageJSON | null = null;
  let assistantMessage: MessageJSON | null = null;

  try {
    const res = await fetch(`/api/chat/${chatId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        ollamaUrl: getOllamaUrl(),
        options: getModelOptions(),
        systemPrompt: getSystemPrompt(),
      }),
      signal,
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6);
        try {
          const data = JSON.parse(jsonStr);
          if (data.error) {
            fullText += `\n\n**Error:** ${data.error}`;
            updateStreamingMessage(streamWrapper, fullText);
          } else if (data.done) {
            fullText = data.fullResponse || fullText;
            updateStreamingMessage(streamWrapper, fullText);
            if (data.userMessageId) userMessageId = data.userMessageId;
            if (data.userMessage) userMessage = data.userMessage;
            if (data.assistantMessage) assistantMessage = data.assistantMessage;
            if (data.tokenUsage) tokenUsage = data.tokenUsage;
            if (state.autoSpeak && fullText) {
              speakText(fullText);
            }
          } else if (data.chunk) {
            fullText += data.chunk;
            updateStreamingMessage(streamWrapper, fullText);
          }
        } catch {
          // Ignorar líneas no JSON
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      fullText += "\n\n*Respuesta detenida por el usuario.*";
    } else {
      fullText += `\n\n**Error de conexión:** ${(err as Error).message}`;
    }
    updateStreamingMessage(streamWrapper, fullText);
  }

  return { fullText, tokenUsage, userMessageId, userMessage, assistantMessage };
}

// ==================================== Envío de mensaje ====================================
export async function sendMessage(): Promise<void> {
  const content = messageInput.value.trim();
  if (!content && !getAttachedFile()) {
    return;
  }
  if (state.isStreaming) return;

  const model = modelSelector.value;
  if (!model) {
    alert("Selecciona un modelo primero.");
    return;
  }

  let finalContent = content;
  const attachedFile = getAttachedFile();
  const fileName = attachedFile?.name || null;
  if (attachedFile) {
    finalContent = `${content}\n\n${formatFileContentForPrompt()}`;
  }

  // Limpiar archivo adjunto después de preparar el mensaje
  clearAttachedFile();

  // Si el chat activo tiene un modelo no local (importado), asignar el modelo seleccionado
  if (
    state.currentChatId &&
    state.currentChatModel &&
    model !== state.currentChatModel
  ) {
    const modelOptions = Array.from(modelSelector.options).map((o) => o.value);
    if (!modelOptions.includes(state.currentChatModel)) {
      try {
        await apiPatch(`/api/chats/${state.currentChatId}/model`, { model });
        state.currentChatModel = model;
        const banner = chatMessages.querySelector(
          ".message.assistant:first-child",
        );
        if (banner?.textContent?.includes("Conversación importada")) {
          banner.remove();
        }
      } catch (err) {
        console.error("Error actualizando modelo del chat:", err);
      }
    }
  }

  // Si no hay chat activo, crear uno
  if (!state.currentChatId) {
    const title = content.substring(0, 40) + (content.length > 40 ? "…" : "");
    try {
      const data = await apiPost<{ chat: ChatJSON }>("/api/new-chat", {
        model,
        title,
      });
      state.currentChatId = data.chat.id;
    } catch (err) {
      console.error("Error creando chat:", err);
      alert("No se pudo crear el chat.");
      return;
    }
  }

  // Mostrar mensaje del usuario con archivo adjunto
  const userMessageContent = content || "";

  const userWrapper = addMessageToUI("user", userMessageContent, {
    timestamp: new Date().toISOString(),
    metrics: { tokenCount: estimateTokensFromText(finalContent) },
  }, fileName);
  messageInput.value = "";
  messageInput.style.height = "auto";

  startStreamingUI();
  const streamWrapper = createStreamingMessage();
  const streamStartedAt = Date.now();

  const result = await readSSEStream(
    state.currentChatId!,
    finalContent,
    streamWrapper,
    state.abortController!.signal,
  );

  if (result.userMessage) {
    updateMessageMetadata(userWrapper, "user", finalContent, {
      id: result.userMessage.id,
      timestamp: result.userMessage.timestamp,
      metrics: result.userMessage.metrics || {
        tokenCount: estimateTokensFromText(finalContent),
      },
    });
  } else if (result.userMessageId) {
    updateMessageMetadata(userWrapper, "user", finalContent, {
      id: result.userMessageId,
    });
  }

  const assistantMeta: MessageRenderMeta = result.assistantMessage
    ? {
        id: result.assistantMessage.id,
        timestamp: result.assistantMessage.timestamp,
        metrics: result.assistantMessage.metrics,
      }
    : buildAssistantFallbackMeta(result, streamStartedAt);

  updateMessageMetadata(
    streamWrapper,
    "assistant",
    result.fullText,
    assistantMeta,
  );

  if (result.tokenUsage) {
    updateTokenUsage(
      result.tokenUsage.promptTokens,
      result.tokenUsage.responseTokens,
    );
  }

  endStreamingUI(streamWrapper);
}
export async function regenerateLastResponse(): Promise<void> {
  if (!state.currentChatId || state.isStreaming) return;

  try {
    await apiDelete(`/api/chats/${state.currentChatId}/last-message`);
  } catch (err) {
    console.error("Error eliminando último mensaje:", err);
    return;
  }

  const allAssistant = chatMessages.querySelectorAll(".message.assistant");
  const lastAssistant = allAssistant[allAssistant.length - 1];
  if (lastAssistant) lastAssistant.remove();

  startStreamingUI();
  const streamWrapper = createStreamingMessage();
  const streamStartedAt = Date.now();

  const result = await readSSEStream(
    state.currentChatId,
    null,
    streamWrapper,
    state.abortController!.signal,
  );

  const assistantMeta: MessageRenderMeta = result.assistantMessage
    ? {
        id: result.assistantMessage.id,
        timestamp: result.assistantMessage.timestamp,
        metrics: result.assistantMessage.metrics,
      }
    : buildAssistantFallbackMeta(result, streamStartedAt);

  updateMessageMetadata(
    streamWrapper,
    "assistant",
    result.fullText,
    assistantMeta,
  );

  if (result.tokenUsage) {
    updateTokenUsage(
      result.tokenUsage.promptTokens,
      result.tokenUsage.responseTokens,
    );
  }

  endStreamingUI(streamWrapper);
}
export async function confirmEditMessage(
  wrapper: HTMLDivElement,
  newContent: string,
): Promise<void> {
  if (!state.currentChatId) return;
  const msgId = wrapper.dataset.msgId;
  if (!msgId) return;

  let updatedUserMessage: MessageJSON | null = null;

  try {
    const data = await apiPut<{ message: MessageJSON }>(
      `/api/chats/${state.currentChatId}/messages/${msgId}`,
      {
        content: newContent,
      },
    );
    updatedUserMessage = data.message;
  } catch (err) {
    console.error("Error editando mensaje:", err);
    return;
  }

  // Eliminar del DOM todos los nodos posteriores a este mensaje
  while (wrapper.nextElementSibling) {
    wrapper.nextElementSibling.remove();
  }

  // Re-renderizar el mensaje editado
  const contentEl = wrapper.querySelector(".message-content") as HTMLDivElement;
  contentEl.innerHTML = `<strong>Usuario</strong><div class="message-body">${formatMarkdown(newContent)}</div>`;
  updateMessageMetadata(wrapper, "user", newContent, {
    id: updatedUserMessage?.id || msgId,
    timestamp: updatedUserMessage?.timestamp || wrapper.dataset.timestamp,
    metrics: updatedUserMessage?.metrics || {
      tokenCount: estimateTokensFromText(newContent),
    },
  });
  addEditButton(wrapper, newContent);

  startStreamingUI();
  const streamWrapper = createStreamingMessage();
  const streamStartedAt = Date.now();

  const result = await readSSEStream(
    state.currentChatId,
    null,
    streamWrapper,
    state.abortController!.signal,
  );

  const assistantMeta: MessageRenderMeta = result.assistantMessage
    ? {
        id: result.assistantMessage.id,
        timestamp: result.assistantMessage.timestamp,
        metrics: result.assistantMessage.metrics,
      }
    : buildAssistantFallbackMeta(result, streamStartedAt);

  updateMessageMetadata(
    streamWrapper,
    "assistant",
    result.fullText,
    assistantMeta,
  );

  if (result.tokenUsage) {
    updateTokenUsage(
      result.tokenUsage.promptTokens,
      result.tokenUsage.responseTokens,
    );
  }

  endStreamingUI(streamWrapper);
}
export async function refreshChatList(): Promise<void> {
  try {
    const query = chatSearchInput.value.trim();
    const endpoint = query
      ? `/api/chats/search?q=${encodeURIComponent(query)}`
      : "/api/chats";
    const data = await apiGet<{ chats: ChatJSON[] }>(endpoint);
    if (data.chats.length === 0) {
      chatsList.innerHTML = query
        ? '<div class="no-chats">Sin resultados</div>'
        : '<div class="no-chats">No hay chats guardados</div>';
      return;
    }

    chatsList.innerHTML = "";
    const sortByDate = (a: ChatJSON, b: ChatJSON) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    const pinned = data.chats.filter((c) => c.pinned).sort(sortByDate);
    const unpinned = data.chats.filter((c) => !c.pinned).sort(sortByDate);

    if (pinned.length > 0) {
      const pinnedHeader = document.createElement("div");
      pinnedHeader.className = "chats-section-header";
      pinnedHeader.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Anclados';
      chatsList.appendChild(pinnedHeader);
      pinned.forEach((chat) => chatsList.appendChild(createChatItem(chat)));
    }

    if (unpinned.length > 0 && pinned.length > 0) {
      const recentHeader = document.createElement("div");
      recentHeader.className = "chats-section-header";
      recentHeader.textContent = "Recientes";
      chatsList.appendChild(recentHeader);
    }
    unpinned.forEach((chat) => chatsList.appendChild(createChatItem(chat)));
  } catch (err) {
    console.error("Error cargando chats:", err);
  }
}

function formatChatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Ayer";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    return date.toLocaleDateString([], { day: "numeric", month: "short" });
  }
}

function createChatItem(chat: ChatJSON): HTMLDivElement {
  const item = document.createElement("div");
  item.className = `chat-item${chat.id === state.currentChatId ? " active" : ""}${chat.pinned ? " pinned" : ""}`;
  item.innerHTML = `
    <div class="chat-item-content">
      <div class="chat-item-title">${escapeHtml(chat.title)}</div>
      <div class="chat-item-date">${formatChatDate(chat.lastMessageAt)}</div>
      <div class="chat-item-meta">${chat.model} - ${chat.messageCount} msgs</div>
    </div>
    <div class="chat-item-actions">
      <button class="pin-chat-btn${chat.pinned ? " active" : ""}" title="${chat.pinned ? "Desanclar" : "Anclar"}">
        <svg viewBox="0 0 24 24" fill="${chat.pinned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>
      <button class="rename-chat-btn" title="Renombrar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
          <path d="m15 5 4 4"></path>
        </svg>
      </button>
      <button class="delete-chat-btn" title="Eliminar chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    </div>
  `;
  item
    .querySelector(".chat-item-content")!
    .addEventListener("click", () => loadChat(chat.id));
  item.querySelector(".pin-chat-btn")!.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePinChat(chat.id);
  });
  item.querySelector(".rename-chat-btn")!.addEventListener("click", (e) => {
    e.stopPropagation();
    startRenameChat(item, chat.id, chat.title);
  });
  item.querySelector(".delete-chat-btn")!.addEventListener("click", (e) => {
    e.stopPropagation();
    state.pendingDeleteChatId = chat.id;
    deleteChatModal.classList.add("active");
  });
  return item;
}

async function togglePinChat(chatId: string): Promise<void> {
  try {
    await apiPatch(`/api/chats/${chatId}/pin`);
    await refreshChatList();
  } catch (err) {
    console.error("Error al anclar/desanclar chat:", err);
  }
}

function startRenameChat(
  item: HTMLDivElement,
  chatId: string,
  currentTitle: string,
): void {
  const titleEl = item.querySelector(".chat-item-title") as HTMLDivElement;
  if (!titleEl || titleEl.querySelector(".rename-input")) return;

  const originalText = titleEl.textContent || currentTitle;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "rename-input";
  input.value = originalText;
  input.maxLength = 100;

  titleEl.textContent = "";
  titleEl.appendChild(input);
  input.focus();
  input.select();

  function commit(): void {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== originalText) {
      fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            titleEl.textContent = newTitle;
          } else {
            titleEl.textContent = originalText;
          }
        })
        .catch(() => {
          titleEl.textContent = originalText;
        });
    } else {
      titleEl.textContent = originalText;
    }
  }

  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    } else if (e.key === "Escape") {
      input.removeEventListener("blur", commit);
      titleEl.textContent = originalText;
    }
  });
}

// ==================================== Cargar chat ====================================
export async function loadChat(chatId: string): Promise<void> {
  try {
    const data = await apiGet<{ chat: ChatJSON }>(`/api/chats/${chatId}`);
    state.currentChatId = chatId;
    state.currentChatModel = data.chat.model;

    const modelOptions = Array.from(modelSelector.options).map((o) => o.value);
    const isLocalModel = modelOptions.includes(data.chat.model);

    if (isLocalModel) {
      modelSelector.value = data.chat.model;
      loadModelInfo(data.chat.model);
    } else {
      if (!modelSelector.value && modelOptions.length > 0) {
        modelSelector.value = modelOptions[0];
      }
    }

    chatMessages.innerHTML = "";

    if (!isLocalModel) {
      const banner = document.createElement("div");
      banner.className = "message assistant";
      banner.innerHTML = `
        <div class="message-content" style="background:var(--warning-bg, #fff8e1);border:1px solid var(--warning-border, #ffe082);border-radius:8px;">
          <strong>⚠️ Conversación importada</strong>
          <p>Este chat fue importado con el modelo <strong>${escapeHtml(data.chat.model)}</strong>, que no está disponible localmente.
          Selecciona un modelo local en el desplegable superior y pulsa <strong>Cargar</strong> para continuar la conversación con un modelo de Ollama.</p>
        </div>`;
      chatMessages.appendChild(banner);
      resetTokenUsage();
    }

    data.chat.messages.forEach((msg: MessageJSON) =>
      addMessageToUI(msg.role, msg.content, {
        id: msg.id,
        timestamp: msg.timestamp,
        metrics: msg.metrics,
      }),
    );

    if (isLocalModel && data.chat.messages.length > 0) {
      countChatTokens(chatId);
    } else if (isLocalModel) {
      resetTokenUsage();
    }

    closeSidebar();
    refreshChatList();
  } catch (err) {
    console.error("Error cargando chat:", err);
  }
}

// ==================================== Acciones de cabecera ====================================
export function newChat(): void {
  state.currentChatId = null;
  state.currentChatModel = null;
  const selectedModel = modelSelector.value;
  if (!selectedModel) {
    modelInfoPanel.style.display = "none";
  }
  const modelInfo = selectedModel
    ? `Modelo activo: <strong>${escapeHtml(selectedModel)}</strong>. ¿En qué puedo ayudarte?`
    : `Selecciona un modelo y ¿en qué puedo ayudarte hoy?`;
  chatMessages.innerHTML = `
    <div class="message assistant">
      <div class="message-content">
        🤖
        <strong style="display:inline-flex;align-items:center;gap:6px;">Asistente</strong>
        <p>¡Hola! Soy tu asistente de IA. ${modelInfo}</p>
      </div>
    </div>`;
  messageInput.value = "";
  messageInput.style.height = "auto";
  state.isStreaming = false;
  sendBtn.disabled = false;
  sendBtn.classList.remove("loading");
  sendText.textContent = "Enviar";
  resetTokenUsage();
  closeSidebar();
}

export function clearChat(): void {
  if (!state.currentChatId) {
    newChat();
    return;
  }
  state.pendingDeleteChatId = state.currentChatId;
  deleteChatModal.classList.add("active");
}

export function closeDeleteChatModal(): void {
  deleteChatModal.classList.remove("active");
  state.pendingDeleteChatId = null;
}

export function confirmDeleteChat(): void {
  const chatIdToDelete = state.pendingDeleteChatId || state.currentChatId;
  if (!chatIdToDelete) {
    closeDeleteChatModal();
    return;
  }

  closeDeleteChatModal();

  apiDelete(`/api/chats/${chatIdToDelete}`)
    .then(() => {
      if (chatIdToDelete === state.currentChatId) {
        newChat();
      }
      refreshChatList();
    })
    .catch((err) => console.error("Error eliminando chat:", err));
}

// ==================================== Cambio de modelo ====================================
export function handleLoadModelClick(): void {
  const newModel = modelSelector.value;
  if (!newModel) return;

  if (
    !state.currentChatId ||
    !state.currentChatModel ||
    newModel === state.currentChatModel
  ) {
    state.currentChatModel = newModel;
    loadModelInfo(newModel);
    newChat();
    return;
  }

  const modelOptions = Array.from(modelSelector.options).map((o) => o.value);
  const currentIsLocal = modelOptions.includes(state.currentChatModel);

  if (!currentIsLocal) {
    state.pendingModel = newModel;
    modelChangeModalText.textContent = `Este chat fue importado con el modelo "${state.currentChatModel}". ¿Deseas asignarle el modelo local "${newModel}" para continuar la conversación?`;
    modelChangeModal.classList.add("active");
    return;
  }

  state.pendingModel = newModel;
  modelChangeModalText.textContent = `Al cambiar al modelo "${newModel}" se abrirá un nuevo chat. La conversación actual se mantendrá guardada. ¿Deseas continuar?`;
  modelChangeModal.classList.add("active");
}

export async function handleModelChangeAccept(): Promise<void> {
  modelChangeModal.classList.remove("active");
  if (!state.pendingModel) return;

  const modelOptions = Array.from(modelSelector.options).map((o) => o.value);
  const currentIsLocal = state.currentChatModel
    ? modelOptions.includes(state.currentChatModel)
    : true;

  if (!currentIsLocal && state.currentChatId) {
    try {
      await apiPatch(`/api/chats/${state.currentChatId}/model`, {
        model: state.pendingModel,
      });
      state.currentChatModel = state.pendingModel;
      modelSelector.value = state.pendingModel;
      loadModelInfo(state.pendingModel);
      await loadChat(state.currentChatId);
    } catch (err) {
      console.error("Error cambiando modelo:", err);
      alert("No se pudo cambiar el modelo del chat.");
    }
    state.pendingModel = null;
    return;
  }

  modelSelector.value = state.pendingModel;
  loadModelInfo(state.pendingModel);
  state.pendingModel = null;
  newChat();
}

export function closeModelChange(): void {
  modelChangeModal.classList.remove("active");
  if (state.currentChatModel) {
    modelSelector.value = state.currentChatModel;
  }
  state.pendingModel = null;
}

import { state } from "../state.js";
import type { MessageMetrics } from "../types.js";
import {
  estimateTokensFromText,
  formatDateTime,
  formatDuration,
  formatMarkdown,
  formatTokenCount,
  escapeHtml,
} from "../utils.js";
import { chatMessages, scrollToBottom } from "./elements.js";
import { speakText, stopSpeaking, isSpeaking } from "../services/ttsService.js";

// Callbacks para romper dependencias circulares con chatService
let onRegenerateCallback: (() => void) | null = null;
let onEditConfirmCallback:
  | ((wrapper: HTMLDivElement, newContent: string) => Promise<void>)
  | null = null;

export interface MessageRenderMeta {
  id?: string;
  timestamp?: string;
  metrics?: MessageMetrics;
}

export function setMessageCallbacks(callbacks: {
  onRegenerate: () => void;
  onEditConfirm: (wrapper: HTMLDivElement, newContent: string) => Promise<void>;
}): void {
  onRegenerateCallback = callbacks.onRegenerate;
  onEditConfirmCallback = callbacks.onEditConfirm;
}

function getMessageTokenCount(
  content: string,
  metrics?: MessageMetrics,
): number {
  if (typeof metrics?.tokenCount === "number") {
    return Math.max(0, Math.round(metrics.tokenCount));
  }
  return estimateTokensFromText(content);
}

function buildMessageMetaText(
  role: string,
  content: string,
  metadata: MessageRenderMeta,
): string {
  const parts: string[] = [];

  if (metadata.timestamp) {
    const dateTime = formatDateTime(metadata.timestamp);
    if (dateTime) parts.push(dateTime);
  }

  const tokenCount = getMessageTokenCount(content, metadata.metrics);
  if (tokenCount > 0) {
    parts.push(`Tokens: ${formatTokenCount(tokenCount)}`);
  }

  if (role === "assistant") {
    if (typeof metadata.metrics?.durationMs === "number") {
      parts.push(`Tiempo: ${formatDuration(metadata.metrics.durationMs)}`);
    }

    if (typeof metadata.metrics?.tokensPerSecond === "number") {
      const speed = Math.max(0, metadata.metrics.tokensPerSecond);
      if (speed > 0) {
        parts.push(`Velocidad: ${speed.toFixed(2)} tok/s`);
      }
    }
  }

  return parts.join(" · ");
}

export function updateMessageMetadata(
  wrapper: HTMLDivElement,
  role: string,
  content: string,
  metadata: MessageRenderMeta = {},
): void {
  if (metadata.id) wrapper.dataset.msgId = metadata.id;
  if (metadata.timestamp) wrapper.dataset.timestamp = metadata.timestamp;

  const contentEl = wrapper.querySelector(
    ".message-content",
  ) as HTMLDivElement | null;
  if (!contentEl) return;

  const metaText = buildMessageMetaText(role, content, metadata);
  const existingMeta = contentEl.querySelector(
    ".message-meta",
  ) as HTMLDivElement | null;

  if (!metaText) {
    if (existingMeta) existingMeta.remove();
    return;
  }

  const metaEl = existingMeta || document.createElement("div");
  metaEl.className = "message-meta";
  metaEl.textContent = metaText;

  if (!existingMeta) {
    contentEl.appendChild(metaEl);
  }
}

function copyMessageToClipboard(
  btn: HTMLButtonElement,
  wrapper: HTMLDivElement,
): void {
  const text =
    wrapper.querySelector(".streaming-text")?.textContent ||
    wrapper.querySelector(".message-body")?.textContent ||
    "";

  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    btn.title = "¡Copiado!";
    setTimeout(() => {
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      btn.title = "Copiar al portapapeles";
    }, 1500);
  });
}

export function addCopyButton(wrapper: HTMLDivElement): void {
  const btn = document.createElement("button");
  btn.className = "copy-msg-btn";
  btn.title = "Copiar al portapapeles";
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
  btn.addEventListener("click", () => copyMessageToClipboard(btn, wrapper));
  wrapper.querySelector(".message-content")!.appendChild(btn);
}

export function addRegenerateButton(wrapper: HTMLDivElement): void {
  const btn = document.createElement("button");
  btn.className = "regenerate-msg-btn";
  btn.title = "Regenerar respuesta";
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`;
  btn.addEventListener("click", () => onRegenerateCallback?.());
  wrapper.querySelector(".message-content")!.appendChild(btn);
}

export function addSpeakButton(wrapper: HTMLDivElement): void {
  const btn = document.createElement("button");
  btn.className = "speak-msg-btn";
  btn.title = "Reproducir en audio";
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;

  const getTextContent = (): string => {
    const bodyEl = wrapper.querySelector(".message-body");
    if (!bodyEl) return "";
    
    const clone = bodyEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("code, pre").forEach(el => el.remove());
    
    let text = clone.textContent || "";
    
    text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
    text = text.replace(/\*([^*]+)\*/g, "$1");
    text = text.replace(/`([^`]+)`/g, "$1");
    text = text.replace(/^#{1,6}\s+/gm, "");
    text = text.replace(/^\s*[-*+]\s+/gm, "");
    text = text.replace(/^\s*\d+\.\s+/gm, "");
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
    text = text.replace(/^\s*[-=_]{3,}\s*$/gm, "");
    
    return text.trim();
  };

  btn.addEventListener("click", () => {
    if (isSpeaking()) {
      stopSpeaking();
    } else {
      const text = getTextContent();
      if (text) {
        speakText(text, btn);
      }
    }
  });

  wrapper.querySelector(".message-content")!.appendChild(btn);
}

export function addEditButton(
  wrapper: HTMLDivElement,
  originalContent: string,
): void {
  const btn = document.createElement("button");
  btn.className = "edit-msg-btn";
  btn.title = "Editar mensaje";
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>`;
  btn.addEventListener("click", () =>
    startEditMessage(wrapper, originalContent),
  );
  wrapper.querySelector(".message-content")!.appendChild(btn);
}

function startEditMessage(
  wrapper: HTMLDivElement,
  originalContent: string,
): void {
  if (state.isStreaming || wrapper.querySelector(".edit-msg-textarea")) return;

  const contentEl = wrapper.querySelector(".message-content") as HTMLDivElement;
  const savedHtml = contentEl.innerHTML;

  contentEl.innerHTML = `<strong>👤 Usuario</strong>`;
  const textarea = document.createElement("textarea");
  textarea.className = "edit-msg-textarea";
  textarea.value = originalContent;
  contentEl.appendChild(textarea);

  const actions = document.createElement("div");
  actions.className = "edit-msg-actions";

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "edit-msg-confirm";
  confirmBtn.textContent = "Confirmar";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "edit-msg-cancel";
  cancelBtn.textContent = "Cancelar";

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);
  contentEl.appendChild(actions);

  textarea.focus();
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";

  cancelBtn.addEventListener("click", () => {
    contentEl.innerHTML = savedHtml;
  });

  confirmBtn.addEventListener("click", () => {
    const newContent = textarea.value.trim();
    if (!newContent) return;
    onEditConfirmCallback?.(wrapper, newContent);
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      contentEl.innerHTML = savedHtml;
    }
  });
}

export function injectCodeCopyButtons(container: HTMLElement): void {
  container.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".code-copy-btn")) return;
    const btn = document.createElement("button");
    btn.className = "code-copy-btn";
    btn.type = "button";
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copiar</span>`;
    btn.addEventListener("click", () => {
      const code = pre.querySelector("code");
      const text = code ? code.textContent || "" : pre.textContent || "";
      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add("copied");
        btn.querySelector("span")!.textContent = "¡Copiado!";
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.querySelector("span")!.textContent = "Copiar";
        }, 1500);
      });
    });
    pre.appendChild(btn);
  });
}

export function addMessageToUI(
  role: string,
  content: string,
  metadata: MessageRenderMeta = {},
  attachedFileName?: string | null,
): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;
  if (metadata.id) wrapper.dataset.msgId = metadata.id;
  if (metadata.timestamp) wrapper.dataset.timestamp = metadata.timestamp;

  const inner = document.createElement("div");
  inner.className = "message-content";

  const label = role === "user" ? "👤 Usuario" : "🤖 Asistente";
  let fileIndicator = "";
  if (role === "user" && attachedFileName) {
    fileIndicator = `<span class="file-attachment-indicator">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <span class="attached-file-name">${escapeHtml(attachedFileName)}</span>
    </span>`;
  }
  // Si el contenido está vacío, mostrar mensaje alternativo
  const safeContent =
    content && content.trim() ? content : "No se pudo generar respuesta.";
  inner.innerHTML = `<strong>${label}:</strong>${fileIndicator}<div class="message-body">${formatMarkdown(safeContent)}</div>`;
  wrapper.appendChild(inner);
  updateMessageMetadata(wrapper, role, content, metadata);

  chatMessages.appendChild(wrapper);
  if (role === "user") {
    addEditButton(wrapper, content);
  }
  if (role === "assistant") {
    addCopyButton(wrapper);
    addRegenerateButton(wrapper);
    addSpeakButton(wrapper);
    injectCodeCopyButtons(wrapper);
  }
  scrollToBottom();
  return wrapper;
}

export function createStreamingMessage(): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "message assistant";

  const inner = document.createElement("div");
  inner.className = "message-content";
  inner.innerHTML = `<strong>🤖 Asistente</strong>
    <div class="thinking-indicator">
      <div class="thinking-spinner"></div>
      <span>Pensando...</span>
    </div>
    <div class='streaming-text message-body' style='display:none'></div>`;
  wrapper.appendChild(inner);
  chatMessages.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

export function updateStreamingMessage(
  wrapper: HTMLDivElement,
  text: string,
): void {
  const thinking = wrapper.querySelector(
    ".thinking-indicator",
  ) as HTMLElement | null;
  const streamEl = wrapper.querySelector(
    ".streaming-text",
  ) as HTMLElement | null;
  if (thinking) {
    thinking.remove();
  }
  if (streamEl) {
    streamEl.style.display = "";
    const safeText =
      text && text.trim() ? text : "No se pudo generar respuesta.";
    streamEl.innerHTML = formatMarkdown(safeText);
    injectCodeCopyButtons(streamEl);

    if (!wrapper.querySelector(".copy-msg-btn")) {
      addCopyButton(wrapper);
      addRegenerateButton(wrapper);
      addSpeakButton(wrapper);
    }
  }
  scrollToBottom();
}

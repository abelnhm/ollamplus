import { state } from "../state.js";
import type { ChatJSON, MessageJSON } from "../types.js";
import { apiGet } from "../api.js";
import { escapeHtml } from "../utils.js";
import { chatMessages, modelSelector, exportModal } from "../ui/elements.js";

export function openExportModal(): void {
  if (!state.currentChatId) {
    alert("No hay conversación activa para exportar.");
    return;
  }
  exportModal.classList.add("active");
}

export function closeExportModal(): void {
  exportModal.classList.remove("active");
}

function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function getChatData(): Promise<ChatJSON | null> {
  if (!state.currentChatId) return null;
  try {
    const data = await apiGet<{ chat: ChatJSON }>(
      `/api/chats/${state.currentChatId}`,
    );
    return data.chat;
  } catch {
    return buildChatFromUI();
  }
}

function buildChatFromUI(): ChatJSON | null {
  const messageDivs = chatMessages.querySelectorAll(".message[data-msg-id]");
  if (messageDivs.length === 0 && !state.currentChatModel) return null;

  const messages: MessageJSON[] = [];
  messageDivs.forEach((div) => {
    const el = div as HTMLElement;
    const id = el.dataset.msgId || "";
    const role = el.classList.contains("user") ? "user" : "assistant";
    const contentEl = el.querySelector(".message-content");
    const content = contentEl ? contentEl.textContent || "" : "";
    messages.push({
      id,
      role,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    });
  });

  const now = new Date().toISOString();
  return {
    id: state.currentChatId || "",
    model: state.currentChatModel || modelSelector.value || "desconocido",
    title: `Chat exportado`,
    messages,
    createdAt: now,
    lastMessageAt: now,
    messageCount: messages.length,
    pinned: false,
  };
}

function exportAsMarkdown(chat: ChatJSON): string {
  const dateStr = new Date(chat.createdAt).toLocaleString();
  let md = `# ${chat.title}\n\n`;
  md += `**Modelo:** ${chat.model}  \n`;
  md += `**Fecha:** ${dateStr}  \n`;
  md += `**Mensajes:** ${chat.messageCount}\n\n---\n\n`;

  for (const msg of chat.messages) {
    const role = msg.role === "user" ? "👤 Usuario" : "🤖 Asistente";
    const time = new Date(msg.timestamp).toLocaleTimeString();
    md += `### ${role} _(${time})_\n\n${msg.content}\n\n---\n\n`;
  }
  return md;
}

function exportAsJSON(chat: ChatJSON): string {
  return JSON.stringify(chat, null, 2);
}

function exportAsHTML(chat: ChatJSON): string {
  const dateStr = new Date(chat.createdAt).toLocaleString();
  const messagesHtml = chat.messages
    .map((msg) => {
      const role = msg.role === "user" ? "👤 Usuario" : "🤖 Asistente";
      const bgColor = msg.role === "user" ? "#e3f2fd" : "#f5f5f5";
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const contentEscaped = escapeHtml(msg.content).replace(/\n/g, "<br>");
      return `<div style="background:${bgColor};border-radius:8px;padding:12px 16px;margin-bottom:12px;">
      <strong>${role}</strong> <small style="color:#888">${time}</small>
      <div style="margin-top:8px;white-space:pre-wrap;">${contentEscaped}</div>
    </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(chat.title)} — OllamaUI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; background: #fff; color: #222; }
    h1 { font-size: 1.5rem; margin-bottom: 4px; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 24px; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(chat.title)}</h1>
  <div class="meta">Modelo: ${escapeHtml(chat.model)} · ${dateStr} · ${chat.messageCount} mensajes</div>
  <hr>
  ${messagesHtml}
</body>
</html>`;
}

function exportAsPDF(chat: ChatJSON): void {
  const htmlContent = exportAsHTML(chat);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert(
      "No se pudo abrir la ventana de impresión. Permite las ventanas emergentes.",
    );
    return;
  }
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.addEventListener("load", () => {
    printWindow.print();
  });
}

export async function exportChat(format: string): Promise<void> {
  const chat = await getChatData();
  if (!chat) {
    alert("No se pudo obtener los datos del chat.");
    return;
  }

  const dateSlug = new Date().toISOString().slice(0, 10);
  const safeName = `chat-${dateSlug}`;

  switch (format) {
    case "markdown": {
      const md = exportAsMarkdown(chat);
      downloadFile(md, `${safeName}.md`, "text/markdown;charset=utf-8");
      break;
    }
    case "json": {
      const json = exportAsJSON(chat);
      downloadFile(json, `${safeName}.json`, "application/json;charset=utf-8");
      break;
    }
    case "html": {
      const html = exportAsHTML(chat);
      downloadFile(html, `${safeName}.html`, "text/html;charset=utf-8");
      break;
    }
    case "pdf": {
      exportAsPDF(chat);
      break;
    }
  }
  closeExportModal();
}

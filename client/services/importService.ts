import { state } from "../state.js";
import type { ChatJSON, ImportedChat } from "../types.js";
import { apiPost } from "../api.js";
import {
  importModal,
  confirmImportBtn,
  importFileInput,
  importDropZone,
  importPreview,
  importFileName,
  importPreviewTitle,
  importPreviewModel,
  importPreviewMessages,
  importError,
} from "../ui/elements.js";
import { loadChat } from "./chatService.js";

export function openImportModal(): void {
  resetImportModal();
  importModal.classList.add("active");
}

export function closeImportModal(): void {
  importModal.classList.remove("active");
  resetImportModal();
}

export function resetImportModal(): void {
  state.pendingImport = null;
  importFileInput.value = "";
  importPreview.style.display = "none";
  importError.style.display = "none";
  importDropZone.style.display = "";
  confirmImportBtn.disabled = true;
}

function showImportError(msg: string): void {
  importError.textContent = msg;
  importError.style.display = "block";
  importPreview.style.display = "none";
  importDropZone.style.display = "";
  confirmImportBtn.disabled = true;
  state.pendingImport = null;
}

// ─── Detectores de formato ───────────────────────────────
function isChatGPTJSON(data: any): boolean {
  return (
    data.title &&
    Array.isArray(data.messages) &&
    !data.model &&
    (data.source?.includes("chatgpt.com") || data.exportMode !== undefined)
  );
}

function isNousSaveJSON(data: any): boolean {
  return (
    data.version && data.meta && data.meta.title && Array.isArray(data.messages)
  );
}

// ─── Parsers JSON ────────────────────────────────────────
function parseNousSaveJSON(data: any): ImportedChat {
  const platform = data.meta.platform || "IA";
  const model = data.meta.model || `${platform} (importado)`;
  const title = data.meta.title;
  const messages = data.messages
    .filter((m: { role?: string; content?: string }) => m.role && m.content)
    .map((m: { role: string; content: string }) => ({
      role: m.role === "ai" ? "assistant" : m.role === "user" ? "user" : m.role,
      content: m.content,
    }));
  if (messages.length === 0) {
    throw new Error("No se encontraron mensajes en el archivo NousSave.");
  }
  return { model, title, messages };
}

function parseImportJSON(text: string): ImportedChat {
  const data = JSON.parse(text);

  if (isNousSaveJSON(data)) {
    return parseNousSaveJSON(data);
  }

  if (isChatGPTJSON(data)) {
    const messages = data.messages
      .filter((m: { role?: string; content?: string }) => m.role && m.content)
      .map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
    if (messages.length === 0) {
      throw new Error("No se encontraron mensajes en el archivo ChatGPT.");
    }
    return { model: "ChatGPT (importado)", title: data.title, messages };
  }

  if (!data.model || !data.title || !Array.isArray(data.messages)) {
    throw new Error("El archivo JSON no tiene el formato esperado.");
  }
  const messages = data.messages
    .filter((m: { role?: string; content?: string }) => m.role && m.content)
    .map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));
  return { model: data.model, title: data.title, messages };
}

// ─── Detectores Markdown ─────────────────────────────────
function isChatGPTMarkdown(text: string): boolean {
  return (
    (text.includes("chatgpt.com") ||
      text.includes("**Tú dijiste:**") ||
      text.includes("**ChatGPT")) &&
    !text.includes("noussave.com")
  );
}

function isNousSaveMarkdown(text: string): boolean {
  return (
    text.includes("noussave.com") ||
    text.includes("NousSave") ||
    (/^## 👤/m.test(text) && /^## 🤖/m.test(text) && /^platform:/m.test(text))
  );
}

// ─── Parsers Markdown ────────────────────────────────────
function parseChatGPTMarkdown(text: string): ImportedChat {
  const lines = text.split("\n");
  let title = "Chat importado (ChatGPT)";
  const messages: { role: string; content: string }[] = [];

  const titleLineFromH1 = lines.find((l) => /^#\s+/.test(l));
  if (titleLineFromH1) {
    title = titleLineFromH1.replace(/^#\s+/, "").trim();
  }
  const fmTitleMatch = text.match(/title:\s*"([^"]+)"/);
  if (fmTitleMatch) {
    title = fmTitleMatch[1];
  }

  const roleRegex = /^\*\*(Tú dijiste:|ChatGPT[^*]*)\*\*$/;
  let currentRole: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const roleMatch = line.trim().match(roleRegex);
    if (roleMatch) {
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join("\n").trim(),
        });
      }
      currentRole = roleMatch[1].startsWith("Tú dijiste")
        ? "user"
        : "assistant";
      currentContent = [];
    } else if (currentRole) {
      currentContent.push(line);
    }
  }
  if (currentRole && currentContent.length > 0) {
    messages.push({
      role: currentRole,
      content: currentContent.join("\n").trim(),
    });
  }

  if (messages.length === 0) {
    throw new Error(
      "No se encontraron mensajes en el archivo Markdown de ChatGPT.",
    );
  }

  return { model: "ChatGPT (importado)", title, messages };
}

function parseNousSaveMarkdown(text: string): ImportedChat {
  const lines = text.split("\n");
  let title = "Chat importado";
  let model = "IA (importado)";
  const messages: { role: string; content: string }[] = [];

  const fmTitleMatch = text.match(/title:\s*"([^"]+)"/);
  if (fmTitleMatch) title = fmTitleMatch[1];

  const fmModelMatch = text.match(/model:\s*"([^"]+)"/);
  if (fmModelMatch) {
    model = fmModelMatch[1];
  } else {
    const modelLine = lines.find((l) => l.includes("**Modelo**"));
    if (modelLine) {
      const m = modelLine.match(/\*\*Modelo\*\*\s*[:：]\s*(.+)/);
      if (m) model = m[1].trim();
    }
  }

  const sectionRegex = /^##\s+(👤|🤖)\s*(.*)$/;
  let currentRole: string | null = null;
  let currentContent: string[] = [];
  let inBlockquote = false;

  for (const line of lines) {
    const sectionMatch = line.match(sectionRegex);
    if (sectionMatch) {
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join("\n").trim(),
        });
      }
      currentRole = sectionMatch[1] === "👤" ? "user" : "assistant";
      currentContent = [];
      inBlockquote = false;
      continue;
    }

    if (!currentRole) continue;

    if (/^\*#\d+/.test(line.trim())) continue;
    if (line.trim() === "---") {
      if (currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join("\n").trim(),
        });
        currentContent = [];
        currentRole = null;
      }
      continue;
    }
    if (line.includes("Generado por") && line.includes("NousSave")) continue;

    if (currentRole === "user" && line.startsWith("> ")) {
      inBlockquote = true;
      currentContent.push(line.slice(2));
    } else if (currentRole === "user" && inBlockquote && line === ">") {
      currentContent.push("");
    } else {
      currentContent.push(line);
    }
  }
  if (currentRole && currentContent.length > 0) {
    messages.push({
      role: currentRole,
      content: currentContent.join("\n").trim(),
    });
  }

  if (messages.length === 0) {
    throw new Error(
      "No se encontraron mensajes en el archivo Markdown de NousSave.",
    );
  }

  return { model, title, messages };
}

function parseImportMarkdown(text: string): ImportedChat {
  if (isNousSaveMarkdown(text)) return parseNousSaveMarkdown(text);
  if (isChatGPTMarkdown(text)) return parseChatGPTMarkdown(text);

  const lines = text.split("\n");
  let title = "Chat importado";
  let model = "desconocido";
  const messages: { role: string; content: string }[] = [];

  const titleMatch = lines[0]?.match(/^#\s+(.+)/);
  if (titleMatch) title = titleMatch[1].trim();

  const modelLine = lines.find((l) => l.startsWith("**Modelo:**"));
  if (modelLine) {
    const m = modelLine.match(/\*\*Modelo:\*\*\s*(.+)/);
    if (m) model = m[1].trim();
  }

  const sectionRegex = /^###\s+(👤\s*Usuario|🤖\s*Asistente)/;
  let currentRole: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const sectionMatch = line.match(sectionRegex);
    if (sectionMatch) {
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join("\n").trim(),
        });
      }
      currentRole = sectionMatch[1].includes("Usuario") ? "user" : "assistant";
      currentContent = [];
    } else if (currentRole) {
      if (line.trim() === "---") continue;
      currentContent.push(line);
    }
  }
  if (currentRole && currentContent.length > 0) {
    messages.push({
      role: currentRole,
      content: currentContent.join("\n").trim(),
    });
  }

  if (messages.length === 0) {
    throw new Error("No se encontraron mensajes en el archivo Markdown.");
  }

  return { model, title, messages };
}

// ─── Manejo de archivos ──────────────────────────────────
export function handleImportFile(file: File): void {
  importError.style.display = "none";

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "json" && ext !== "md") {
    showImportError("Formato no soportado. Usa archivos .md o .json.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = reader.result as string;
      const parsed =
        ext === "json" ? parseImportJSON(text) : parseImportMarkdown(text);

      state.pendingImport = parsed;

      importFileName.textContent = file.name;
      importPreviewTitle.textContent = `Título: ${parsed.title}`;
      importPreviewModel.textContent = `Modelo: ${parsed.model}`;
      importPreviewMessages.textContent = `Mensajes: ${parsed.messages.length}`;
      importPreview.style.display = "block";
      importDropZone.style.display = "none";
      confirmImportBtn.disabled = false;
    } catch (err) {
      showImportError((err as Error).message || "Error al leer el archivo.");
    }
  };
  reader.readAsText(file);
}

export async function confirmImport(): Promise<void> {
  if (!state.pendingImport) return;

  confirmImportBtn.disabled = true;
  confirmImportBtn.textContent = "Importando…";

  try {
    const data = await apiPost<{ chat: ChatJSON }>("/api/import-chat", {
      model: state.pendingImport.model,
      title: state.pendingImport.title,
      messages: state.pendingImport.messages,
    });
    closeImportModal();
    await loadChat(data.chat.id);
  } catch (err) {
    showImportError(
      (err as Error).message || "Error al importar la conversación.",
    );
  } finally {
    confirmImportBtn.textContent = "Importar";
    confirmImportBtn.disabled = !state.pendingImport;
  }
}

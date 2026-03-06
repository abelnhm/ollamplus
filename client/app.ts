// ─── Tipos ───────────────────────────────────────────────
interface ChatJSON {
  id: string;
  model: string;
  title: string;
  messages: MessageJSON[];
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  pinned: boolean;
}

interface MessageJSON {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

// ─── Estado global ───────────────────────────────────────
let currentChatId: string | null = null;
let currentChatModel: string | null = null;
let isStreaming = false;
let abortController: AbortController | null = null;

// ─── Elementos del DOM ──────────────────────────────────
const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

const chatMessages = $<HTMLDivElement>("chatMessages");
const messageInput = $<HTMLTextAreaElement>("messageInput");
const sendBtn = $<HTMLButtonElement>("sendBtn");
const sendIcon = $<HTMLElement>("sendIcon");
const sendText = $<HTMLSpanElement>("sendText");
const modelSelector = $<HTMLSelectElement>("modelSelector");
const modelStatus = $<HTMLSpanElement>("modelStatus");
const sidebar = $<HTMLDivElement>("sidebar");
const sidebarOverlay = $<HTMLDivElement>("sidebarOverlay");
const chatsList = $<HTMLDivElement>("chatsList");

// Botones de cabecera
const toggleSidebarBtn = $<HTMLButtonElement>("toggleSidebarBtn");
const closeSidebarBtn = $<HTMLButtonElement>("closeSidebarBtn");
const newChatBtn = $<HTMLButtonElement>("newChatBtn");
const exportBtn = $<HTMLButtonElement>("exportBtn");
const clearBtn = $<HTMLButtonElement>("clearBtn");
const settingsBtn = $<HTMLButtonElement>("settingsBtn");
const darkModeToggle = $<HTMLButtonElement>("darkModeToggle");

// Modal de configuración
const settingsModal = $<HTMLDivElement>("settingsModal");
const ollamaHostInput = $<HTMLInputElement>("ollamaHost");
const ollamaPortInput = $<HTMLInputElement>("ollamaPort");
const urlPreview = $<HTMLElement>("urlPreview");
const testConnectionBtn = $<HTMLButtonElement>("testConnection");
const testResult = $<HTMLElement>("testResult");
const saveSettingsBtn = $<HTMLButtonElement>("saveSettings");
const cancelSettingsBtn = $<HTMLButtonElement>("cancelSettings");
const closeSettingsModal = $<HTMLButtonElement>("closeSettingsModal");

// Barra de cambio de modelo
const loadModelBtn = $<HTMLButtonElement>("loadModelBtn");
const modelChangeModal = $<HTMLDivElement>("modelChangeModal");
const modelChangeModalText = $<HTMLParagraphElement>("modelChangeModalText");
const modelChangeAcceptBtn = $<HTMLButtonElement>("modelChangeAcceptBtn");
const modelChangeCancelBtn = $<HTMLButtonElement>("modelChangeCancelBtn");
const closeModelChangeModal = $<HTMLButtonElement>("closeModelChangeModal");

// Botón de parar
const stopBtn = $<HTMLButtonElement>("stopBtn");

// Panel de parámetros del modelo
const modelParamsToggle = $<HTMLButtonElement>("modelParamsToggle");
const modelParamsPanel = $<HTMLDivElement>("modelParamsPanel");
const enableModelParams = $<HTMLInputElement>("enableModelParams");
const modelParamsForm = $<HTMLDivElement>("modelParamsForm");
const resetParamsBtn = $<HTMLButtonElement>("resetParamsBtn");

// Panel de instrucciones (system prompt)
const systemPromptToggle = $<HTMLButtonElement>("systemPromptToggle");
const systemPromptPanel = $<HTMLDivElement>("systemPromptPanel");
const enableSystemPrompt = $<HTMLInputElement>("enableSystemPrompt");
const systemPromptForm = $<HTMLDivElement>("systemPromptForm");
const systemPromptInput = $<HTMLTextAreaElement>("systemPromptInput");
const clearSystemPromptBtn = $<HTMLButtonElement>("clearSystemPrompt");

// Modal de confirmación de eliminar chat
const deleteChatModal = $<HTMLDivElement>("deleteChatModal");
const closeDeleteChatModalBtn = $<HTMLButtonElement>("closeDeleteChatModal");
const deleteChatAcceptBtn = $<HTMLButtonElement>("deleteChatAcceptBtn");
const deleteChatCancelBtn = $<HTMLButtonElement>("deleteChatCancelBtn");

// Búsqueda de chats en sidebar
const chatSearchInput = $<HTMLInputElement>("chatSearchInput");

// Panel de información del modelo
const modelInfoPanel = $<HTMLDivElement>("modelInfoPanel");
const modelInfoFamily = $<HTMLSpanElement>("modelInfoFamily");
const modelInfoSize = $<HTMLSpanElement>("modelInfoSize");
const modelInfoQuant = $<HTMLSpanElement>("modelInfoQuant");
const modelInfoFormat = $<HTMLSpanElement>("modelInfoFormat");
const modelInfoVramItem = $<HTMLDivElement>("modelInfoVramItem");
const modelInfoVram = $<HTMLSpanElement>("modelInfoVram");

// Indicador de tokens
const tokenUsageContainer = $<HTMLDivElement>("tokenUsageContainer");
const tokenUsageSummary = $<HTMLSpanElement>("tokenUsageSummary");
const tokenUsageBar = $<HTMLDivElement>("tokenUsageBar");
const tokenPromptCount = $<HTMLElement>("tokenPromptCount");
const tokenResponseCount = $<HTMLElement>("tokenResponseCount");
const tokenContextLimit = $<HTMLElement>("tokenContextLimit");

// Prompt Templates
const promptTemplatesBtn = $<HTMLButtonElement>("promptTemplatesBtn");
const promptTemplatesDropdown = $<HTMLDivElement>("promptTemplatesDropdown");
const promptTemplatesList = $<HTMLDivElement>("promptTemplatesList");
const templateSearchInput = $<HTMLInputElement>("templateSearchInput");
const manageTemplatesBtn = $<HTMLButtonElement>("manageTemplatesBtn");
const templateModal = $<HTMLDivElement>("templateModal");
const closeTemplateModalBtn = $<HTMLButtonElement>("closeTemplateModal");
const cancelTemplateBtn = $<HTMLButtonElement>("cancelTemplateBtn");
const saveTemplateBtn = $<HTMLButtonElement>("saveTemplateBtn");
const templateNameInput = $<HTMLInputElement>("templateNameInput");
const templateTextInput = $<HTMLInputElement>("templateTextInput");
const templateManageList = $<HTMLDivElement>("templateManageList");

// Estado de tokens
let totalTokensUsed = 0;
let modelContextLength = 0;

// ─── Helpers ─────────────────────────────────────────────
function getOllamaUrl(): string {
  const host = localStorage.getItem("ollamaHost") || "localhost";
  const port = localStorage.getItem("ollamaPort") || "11434";
  return `http://${host}:${port}`;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatMarkdown(text: string): string {
  // marked y hljs se cargan desde CDN
  const marked = (window as any).marked;
  const hljs = (window as any).hljs;

  if (marked) {
    marked.setOptions({
      highlight(code: string, lang: string) {
        if (hljs && lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs ? hljs.highlightAuto(code).value : escapeHtml(code);
      },
      breaks: true,
    });
    return marked.parse(text) as string;
  }
  return escapeHtml(text).replace(/\n/g, "<br>");
}

let inputMaxHeight = 150;
function autoResize(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height =
    Math.min(textarea.scrollHeight, inputMaxHeight) + "px";
}

function scrollToBottom(): void {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ─── System Prompt ───────────────────────────────────────
function getSystemPrompt(): string | null {
  if (!enableSystemPrompt.checked) return null;
  const text = systemPromptInput.value.trim();
  return text || null;
}

function saveSystemPromptToStorage(): void {
  localStorage.setItem(
    "systemPromptEnabled",
    enableSystemPrompt.checked ? "1" : "0",
  );
  localStorage.setItem("systemPromptText", systemPromptInput.value);
}

function loadSystemPromptFromStorage(): void {
  const enabled = localStorage.getItem("systemPromptEnabled") === "1";
  const text = localStorage.getItem("systemPromptText") || "";
  enableSystemPrompt.checked = enabled;
  systemPromptInput.value = text;
  systemPromptForm.classList.toggle("enabled", enabled);
}

// ─── Parámetros del modelo ───────────────────────────────
interface ModelOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_ctx?: number;
  repeat_penalty?: number;
  seed?: number;
  num_predict?: number;
  stop?: string[];
  mirostat?: number;
  mirostat_tau?: number;
  mirostat_eta?: number;
}

const PARAM_DEFAULTS: Record<string, number | string> = {
  temperature: 0.8,
  top_p: 0.9,
  top_k: 40,
  num_ctx: 2048,
  repeat_penalty: 1.1,
  seed: "",
  num_predict: -1,
  stop: "",
  mirostat: 0,
  mirostat_tau: 5.0,
  mirostat_eta: 0.1,
};

function getModelOptions(): ModelOptions | null {
  if (!enableModelParams.checked) return null;

  const opts: ModelOptions = {};

  const tempEl = document.getElementById(
    "param_temperature_val",
  ) as HTMLInputElement;
  if (tempEl) opts.temperature = parseFloat(tempEl.value);

  const topPEl = document.getElementById("param_top_p_val") as HTMLInputElement;
  if (topPEl) opts.top_p = parseFloat(topPEl.value);

  const topKEl = document.getElementById("param_top_k") as HTMLInputElement;
  if (topKEl) opts.top_k = parseInt(topKEl.value, 10);

  const numCtxEl = document.getElementById(
    "param_num_ctx",
  ) as HTMLSelectElement;
  if (numCtxEl) opts.num_ctx = parseInt(numCtxEl.value, 10);

  const repeatEl = document.getElementById(
    "param_repeat_penalty_val",
  ) as HTMLInputElement;
  if (repeatEl) opts.repeat_penalty = parseFloat(repeatEl.value);

  const seedEl = document.getElementById("param_seed") as HTMLInputElement;
  if (seedEl && seedEl.value !== "") opts.seed = parseInt(seedEl.value, 10);

  const numPredEl = document.getElementById(
    "param_num_predict",
  ) as HTMLInputElement;
  if (numPredEl) opts.num_predict = parseInt(numPredEl.value, 10);

  const stopEl = document.getElementById("param_stop") as HTMLInputElement;
  if (stopEl && stopEl.value.trim() !== "") {
    opts.stop = stopEl.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const mirostatEl = document.getElementById(
    "param_mirostat",
  ) as HTMLSelectElement;
  if (mirostatEl) opts.mirostat = parseInt(mirostatEl.value, 10);

  const mirostatTauEl = document.getElementById(
    "param_mirostat_tau_val",
  ) as HTMLInputElement;
  if (mirostatTauEl) opts.mirostat_tau = parseFloat(mirostatTauEl.value);

  const mirostatEtaEl = document.getElementById(
    "param_mirostat_eta_val",
  ) as HTMLInputElement;
  if (mirostatEtaEl) opts.mirostat_eta = parseFloat(mirostatEtaEl.value);

  return opts;
}

function resetModelParams(): void {
  const pairs: [string, string][] = [
    ["param_temperature", "param_temperature_val"],
    ["param_top_p", "param_top_p_val"],
    ["param_repeat_penalty", "param_repeat_penalty_val"],
    ["param_mirostat_tau", "param_mirostat_tau_val"],
    ["param_mirostat_eta", "param_mirostat_eta_val"],
  ];
  for (const [rangeId, numId] of pairs) {
    const key = rangeId.replace("param_", "");
    const def = PARAM_DEFAULTS[key];
    (document.getElementById(rangeId) as HTMLInputElement).value = String(def);
    (document.getElementById(numId) as HTMLInputElement).value = String(def);
  }

  (document.getElementById("param_top_k") as HTMLInputElement).value = String(
    PARAM_DEFAULTS.top_k,
  );
  (document.getElementById("param_num_ctx") as HTMLSelectElement).value =
    String(PARAM_DEFAULTS.num_ctx);
  (document.getElementById("param_seed") as HTMLInputElement).value = "";
  (document.getElementById("param_num_predict") as HTMLInputElement).value =
    String(PARAM_DEFAULTS.num_predict);
  (document.getElementById("param_stop") as HTMLInputElement).value = "";
  (document.getElementById("param_mirostat") as HTMLSelectElement).value =
    String(PARAM_DEFAULTS.mirostat);
}

function initParamSync(): void {
  const pairs: [string, string][] = [
    ["param_temperature", "param_temperature_val"],
    ["param_top_p", "param_top_p_val"],
    ["param_repeat_penalty", "param_repeat_penalty_val"],
    ["param_mirostat_tau", "param_mirostat_tau_val"],
    ["param_mirostat_eta", "param_mirostat_eta_val"],
  ];
  for (const [rangeId, numId] of pairs) {
    const range = document.getElementById(rangeId) as HTMLInputElement;
    const num = document.getElementById(numId) as HTMLInputElement;
    range.addEventListener("input", () => {
      num.value = range.value;
    });
    num.addEventListener("input", () => {
      range.value = num.value;
    });
  }
}

function initParamTooltips(): void {
  let activeTooltip: HTMLElement | null = null;

  function removeTooltip(): void {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }

  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(
      ".param-help-btn",
    ) as HTMLElement | null;
    if (!btn) {
      removeTooltip();
      return;
    }

    e.stopPropagation();
    if (activeTooltip) {
      removeTooltip();
      return;
    }

    const text = btn.getAttribute("data-tooltip") || "";
    const tip = document.createElement("div");
    tip.className = "param-tooltip";
    tip.textContent = text;
    document.body.appendChild(tip);

    const rect = btn.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.left - 100;
    if (left < 8) left = 8;
    if (left + 280 > window.innerWidth) left = window.innerWidth - 288;
    if (top + 100 > window.innerHeight) top = rect.top - tip.offsetHeight - 6;

    tip.style.top = top + "px";
    tip.style.left = left + "px";
    activeTooltip = tip;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") removeTooltip();
  });
}

// ─── API helpers ─────────────────────────────────────────
async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(path, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
}

async function apiPut<T>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

async function apiPatch<T>(path: string, body: object = {}): Promise<T> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatTokenCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function updateTokenDisplay(): void {
  // Obtener el límite efectivo: parámetro num_ctx del usuario o el del modelo
  const numCtxEl = document.getElementById(
    "param_num_ctx",
  ) as HTMLSelectElement | null;
  const userCtx =
    enableModelParams.checked && numCtxEl ? parseInt(numCtxEl.value, 10) : 0;
  const effectiveLimit = userCtx > 0 ? userCtx : modelContextLength;

  if (effectiveLimit <= 0 && totalTokensUsed <= 0) {
    tokenUsageContainer.style.display = "none";
    return;
  }

  tokenUsageContainer.style.display = "";

  const limit = effectiveLimit > 0 ? effectiveLimit : 0;
  const pct = limit > 0 ? Math.min((totalTokensUsed / limit) * 100, 100) : 0;

  tokenUsageSummary.textContent =
    limit > 0
      ? `${formatTokenCount(totalTokensUsed)} / ${formatTokenCount(limit)}`
      : `${formatTokenCount(totalTokensUsed)}`;
  tokenContextLimit.textContent = limit > 0 ? formatTokenCount(limit) : "—";

  tokenUsageBar.style.width = pct + "%";
  tokenUsageBar.classList.remove("warning", "danger");
  if (pct >= 90) {
    tokenUsageBar.classList.add("danger");
  } else if (pct >= 70) {
    tokenUsageBar.classList.add("warning");
  }
}

function updateTokenUsage(promptTokens: number, responseTokens: number): void {
  totalTokensUsed = promptTokens + responseTokens;
  tokenPromptCount.textContent = formatTokenCount(promptTokens);
  tokenResponseCount.textContent = formatTokenCount(responseTokens);
  updateTokenDisplay();
}

function resetTokenUsage(): void {
  totalTokensUsed = 0;
  tokenPromptCount.textContent = "0";
  tokenResponseCount.textContent = "0";
  updateTokenDisplay();
}

async function loadModelInfo(modelName: string): Promise<void> {
  modelInfoPanel.style.display = "none";
  if (!modelName) return;

  try {
    const data = await apiPost<{
      info: {
        family: string;
        parameter_size: string;
        quantization_level: string;
        format: string;
        families: string[];
        size_vram: number;
        context_length: number;
      };
    }>("/api/model-info", {
      ollamaUrl: getOllamaUrl(),
      model: modelName,
    });

    const info = data.info;
    modelInfoFamily.textContent = info.family;
    modelInfoSize.textContent = info.parameter_size;
    modelInfoQuant.textContent = info.quantization_level;
    modelInfoFormat.textContent = info.format;

    if (info.size_vram > 0) {
      modelInfoVram.textContent = formatBytes(info.size_vram);
      modelInfoVramItem.style.display = "";
    } else {
      modelInfoVramItem.style.display = "none";
    }

    // Guardar context length del modelo y actualizar indicador
    modelContextLength = info.context_length || 0;
    updateTokenDisplay();

    modelInfoPanel.style.display = "";
  } catch (err) {
    console.error("Error cargando info del modelo:", err);
    modelInfoPanel.style.display = "none";
  }
}

// ─── Modelos ─────────────────────────────────────────────
async function loadModels(): Promise<void> {
  modelStatus.textContent = "Cargando…";
  try {
    const data = await apiPost<{ models: OllamaModel[] }>("/api/models", {
      ollamaUrl: getOllamaUrl(),
    });

    modelSelector.innerHTML = "";
    if (data.models.length === 0) {
      modelSelector.innerHTML =
        '<option value="">No hay modelos disponibles</option>';
      modelStatus.textContent = "⚠️ Sin modelos";
      return;
    }

    data.models.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.name;
      opt.textContent = m.name;
      modelSelector.appendChild(opt);
    });

    modelStatus.textContent = `✅ ${data.models.length} modelo(s)`;
  } catch (err) {
    modelSelector.innerHTML =
      '<option value="">Error al cargar modelos</option>';
    modelStatus.textContent = "❌ Sin conexión";
    console.error("Error cargando modelos:", err);
  }
}

// ─── Renderizado de mensajes ─────────────────────────────
function copyMessageToClipboard(
  btn: HTMLButtonElement,
  wrapper: HTMLDivElement,
): void {
  const text =
    wrapper.querySelector(".streaming-text")?.textContent ||
    wrapper
      .querySelector(".message-content")
      ?.textContent?.replace(/^🤖 Asistente:/, "")
      .trim() ||
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

function addCopyButton(wrapper: HTMLDivElement): void {
  const btn = document.createElement("button");
  btn.className = "copy-msg-btn";
  btn.title = "Copiar al portapapeles";
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
  btn.addEventListener("click", () => copyMessageToClipboard(btn, wrapper));
  wrapper.querySelector(".message-content")!.appendChild(btn);
}

function addRegenerateButton(wrapper: HTMLDivElement): void {
  const btn = document.createElement("button");
  btn.className = "regenerate-msg-btn";
  btn.title = "Regenerar respuesta";
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`;
  btn.addEventListener("click", () => regenerateLastResponse());
  wrapper.querySelector(".message-content")!.appendChild(btn);
}

function addEditButton(wrapper: HTMLDivElement, originalContent: string): void {
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
  if (isStreaming || wrapper.querySelector(".edit-msg-textarea")) return;

  const contentEl = wrapper.querySelector(".message-content") as HTMLDivElement;
  const savedHtml = contentEl.innerHTML;

  // Build edit UI
  contentEl.innerHTML = `<strong>👤 Tú:</strong>`;
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
    confirmEditMessage(wrapper, newContent);
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      contentEl.innerHTML = savedHtml;
    }
  });
}

async function confirmEditMessage(
  wrapper: HTMLDivElement,
  newContent: string,
): Promise<void> {
  if (!currentChatId) return;
  const msgId = wrapper.dataset.msgId;
  if (!msgId) return;

  // Truncar en el servidor
  try {
    await apiPut(`/api/chats/${currentChatId}/messages/${msgId}`, {
      content: newContent,
    });
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
  contentEl.innerHTML = `<strong>👤 Tú:</strong>${formatMarkdown(newContent)}`;
  addEditButton(wrapper, newContent);

  // Re-enviar al modelo desde el historial truncado
  isStreaming = true;
  abortController = new AbortController();
  sendBtn.disabled = true;
  sendBtn.style.display = "none";
  stopBtn.style.display = "flex";
  sendBtn.classList.add("loading");
  sendText.textContent = "Pensando…";

  const streamWrapper = createStreamingMessage();
  let fullText = "";

  try {
    const res = await fetch(`/api/chat/${currentChatId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: null,
        ollamaUrl: getOllamaUrl(),
        options: getModelOptions(),
        systemPrompt: getSystemPrompt(),
      }),
      signal: abortController.signal,
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
            if (data.tokenUsage) {
              updateTokenUsage(
                data.tokenUsage.promptTokens,
                data.tokenUsage.responseTokens,
              );
            }
          } else if (data.chunk) {
            fullText += data.chunk;
            updateStreamingMessage(streamWrapper, fullText);
          }
        } catch {
          // ignorar líneas no JSON
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
  } finally {
    isStreaming = false;
    abortController = null;
    sendBtn.disabled = false;
    sendBtn.style.display = "";
    stopBtn.style.display = "none";
    sendBtn.classList.remove("loading");
    sendText.textContent = "Enviar";
    addCopyButton(streamWrapper);
    addRegenerateButton(streamWrapper);
    refreshChatList();
  }
}

function injectCodeCopyButtons(container: HTMLElement): void {
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

function addMessageToUI(
  role: string,
  content: string,
  messageId?: string,
): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;
  if (messageId) wrapper.dataset.msgId = messageId;

  const inner = document.createElement("div");
  inner.className = "message-content";

  const label = role === "user" ? "👤 Tú" : "🤖 Asistente";
  inner.innerHTML = `<strong>${label}:</strong>${formatMarkdown(content)}`;
  wrapper.appendChild(inner);
  chatMessages.appendChild(wrapper);
  if (role === "user" && messageId) {
    addEditButton(wrapper, content);
  }
  if (role === "assistant") {
    addCopyButton(wrapper);
    addRegenerateButton(wrapper);
    injectCodeCopyButtons(wrapper);
  }
  scrollToBottom();
  return wrapper;
}

function createStreamingMessage(): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "message assistant";

  const inner = document.createElement("div");
  inner.className = "message-content";
  inner.innerHTML = `<strong>🤖 Asistente:</strong>
    <div class="thinking-indicator">
      <div class="thinking-spinner"></div>
      <span>Pensando…</span>
    </div>
    <span class='streaming-text' style='display:none'></span>`;
  wrapper.appendChild(inner);
  chatMessages.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

function updateStreamingMessage(wrapper: HTMLDivElement, text: string): void {
  const thinking = wrapper.querySelector(
    ".thinking-indicator",
  ) as HTMLElement | null;
  const span = wrapper.querySelector(".streaming-text") as HTMLElement | null;
  if (thinking) {
    thinking.remove();
  }
  if (span) {
    span.style.display = "";
    span.innerHTML = formatMarkdown(text);
    injectCodeCopyButtons(span);
  }
  scrollToBottom();
}

// ─── Regenerar última respuesta ──────────────────────────
async function regenerateLastResponse(): Promise<void> {
  if (!currentChatId || isStreaming) return;

  // Eliminar último mensaje assistant del backend
  try {
    await apiDelete(`/api/chats/${currentChatId}/last-message`);
  } catch (err) {
    console.error("Error eliminando último mensaje:", err);
    return;
  }

  // Eliminar el último div assistant del DOM
  const allAssistant = chatMessages.querySelectorAll(".message.assistant");
  const lastAssistant = allAssistant[allAssistant.length - 1];
  if (lastAssistant) lastAssistant.remove();

  // Re-enviar el historial existente (sin nuevo mensaje de usuario)
  isStreaming = true;
  abortController = new AbortController();
  sendBtn.disabled = true;
  sendBtn.style.display = "none";
  stopBtn.style.display = "flex";
  sendBtn.classList.add("loading");
  sendText.textContent = "Pensando…";

  const streamWrapper = createStreamingMessage();
  let fullText = "";

  try {
    const res = await fetch(`/api/chat/${currentChatId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: null,
        ollamaUrl: getOllamaUrl(),
        options: getModelOptions(),
        systemPrompt: getSystemPrompt(),
      }),
      signal: abortController.signal,
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
            if (data.tokenUsage) {
              updateTokenUsage(
                data.tokenUsage.promptTokens,
                data.tokenUsage.responseTokens,
              );
            }
          } else if (data.chunk) {
            fullText += data.chunk;
            updateStreamingMessage(streamWrapper, fullText);
          }
        } catch {
          // ignorar líneas no JSON
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
  } finally {
    isStreaming = false;
    abortController = null;
    sendBtn.disabled = false;
    sendBtn.style.display = "";
    stopBtn.style.display = "none";
    sendBtn.classList.remove("loading");
    sendText.textContent = "Enviar";
    addCopyButton(streamWrapper);
    addRegenerateButton(streamWrapper);
    refreshChatList();
  }
}

// ─── Envío de mensaje (streaming SSE) ────────────────────
async function sendMessage(): Promise<void> {
  const content = messageInput.value.trim();
  if (!content || isStreaming) return;

  const model = modelSelector.value;
  if (!model) {
    alert("Selecciona un modelo primero.");
    return;
  }

  // Si no hay chat activo, crear uno
  if (!currentChatId) {
    const title = content.substring(0, 40) + (content.length > 40 ? "…" : "");
    try {
      const data = await apiPost<{ chat: ChatJSON }>("/api/new-chat", {
        model,
        title,
      });
      currentChatId = data.chat.id;
    } catch (err) {
      console.error("Error creando chat:", err);
      alert("No se pudo crear el chat.");
      return;
    }
  }

  // Mostrar mensaje del usuario
  const userWrapper = addMessageToUI("user", content);
  messageInput.value = "";
  messageInput.style.height = "auto";

  // Estado de streaming
  isStreaming = true;
  abortController = new AbortController();
  sendBtn.disabled = true;
  sendBtn.style.display = "none";
  stopBtn.style.display = "flex";
  sendBtn.classList.add("loading");
  sendText.textContent = "Pensando…";

  const streamWrapper = createStreamingMessage();
  let fullText = "";

  try {
    const res = await fetch(`/api/chat/${currentChatId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        ollamaUrl: getOllamaUrl(),
        options: getModelOptions(),
        systemPrompt: getSystemPrompt(),
      }),
      signal: abortController.signal,
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
            if (data.userMessageId && userWrapper) {
              userWrapper.dataset.msgId = data.userMessageId;
              addEditButton(userWrapper, content);
            }
            if (data.tokenUsage) {
              updateTokenUsage(
                data.tokenUsage.promptTokens,
                data.tokenUsage.responseTokens,
              );
            }
          } else if (data.chunk) {
            fullText += data.chunk;
            updateStreamingMessage(streamWrapper, fullText);
          }
        } catch {
          // ignorar líneas no JSON
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
  } finally {
    isStreaming = false;
    abortController = null;
    sendBtn.disabled = false;
    sendBtn.style.display = "";
    stopBtn.style.display = "none";
    sendBtn.classList.remove("loading");
    sendText.textContent = "Enviar";
    addCopyButton(streamWrapper);
    addRegenerateButton(streamWrapper);
    refreshChatList();
  }
}

// ─── Sidebar: lista de chats ─────────────────────────────
async function refreshChatList(): Promise<void> {
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
    // Separar chats anclados y normales
    const sortByDate = (a: ChatJSON, b: ChatJSON) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    const pinned = data.chats.filter((c) => c.pinned).sort(sortByDate);
    const unpinned = data.chats.filter((c) => !c.pinned).sort(sortByDate);

    if (pinned.length > 0) {
      const pinnedHeader = document.createElement("div");
      pinnedHeader.className = "chats-section-header";
      pinnedHeader.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Anclados`;
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

function createChatItem(chat: ChatJSON): HTMLDivElement {
  const item = document.createElement("div");
  item.className = `chat-item${chat.id === currentChatId ? " active" : ""}${chat.pinned ? " pinned" : ""}`;
  item.innerHTML = `
    <div class="chat-item-content">
      <div class="chat-item-title">${escapeHtml(chat.title)}</div>
      <div class="chat-item-meta">${chat.model} · ${chat.messageCount} msgs</div>
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

async function loadChat(chatId: string): Promise<void> {
  try {
    const data = await apiGet<{ chat: ChatJSON }>(`/api/chats/${chatId}`);
    currentChatId = chatId;
    currentChatModel = data.chat.model;

    // Seleccionar el modelo del chat
    modelSelector.value = data.chat.model;
    loadModelInfo(data.chat.model);

    // Limpiar mensajes y renderizar los existentes
    chatMessages.innerHTML = "";
    data.chat.messages.forEach((msg) =>
      addMessageToUI(msg.role, msg.content, msg.id),
    );

    closeSidebar();
    refreshChatList();
  } catch (err) {
    console.error("Error cargando chat:", err);
  }
}

// ─── Acciones de cabecera ────────────────────────────────
function newChat(): void {
  currentChatId = null;
  currentChatModel = null;
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
        <strong>🤖 Asistente:</strong>
        <p>¡Hola! Soy tu asistente de IA. ${modelInfo}</p>
      </div>
    </div>`;
  messageInput.value = "";
  messageInput.style.height = "auto";
  isStreaming = false;
  sendBtn.disabled = false;
  sendBtn.classList.remove("loading");
  sendText.textContent = "Enviar";
  resetTokenUsage();
  closeSidebar();
}

function clearChat(): void {
  if (!currentChatId) {
    newChat();
    return;
  }
  deleteChatModal.classList.add("active");
}

function closeDeleteChatModal(): void {
  deleteChatModal.classList.remove("active");
}

function confirmDeleteChat(): void {
  closeDeleteChatModal();
  apiDelete(`/api/chats/${currentChatId}`)
    .then(() => {
      newChat();
      refreshChatList();
    })
    .catch((err) => console.error("Error eliminando chat:", err));
}

closeDeleteChatModalBtn.addEventListener("click", closeDeleteChatModal);
deleteChatCancelBtn.addEventListener("click", closeDeleteChatModal);
deleteChatAcceptBtn.addEventListener("click", confirmDeleteChat);
deleteChatModal.addEventListener("click", (e) => {
  if (e.target === deleteChatModal) closeDeleteChatModal();
});

// ─── Modal de exportación ─────────────────────────────────
const exportModal = $("exportModal") as HTMLDivElement;
const closeExportModalBtn = $("closeExportModal") as HTMLButtonElement;
const cancelExportBtn = $("cancelExportBtn") as HTMLButtonElement;

function openExportModal(): void {
  if (!currentChatId) {
    alert("No hay conversación activa para exportar.");
    return;
  }
  exportModal.classList.add("active");
}

function closeExportModal(): void {
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
  if (!currentChatId) return null;
  try {
    const data = await apiGet<{ chat: ChatJSON }>(
      `/api/chats/${currentChatId}`,
    );
    return data.chat;
  } catch {
    return null;
  }
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

async function exportChat(format: string): Promise<void> {
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

// ─── Sidebar toggle ──────────────────────────────────────
function openSidebar(): void {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("active");
  refreshChatList();
}

function closeSidebar(): void {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
}

// ─── Tema oscuro ─────────────────────────────────────────
function initTheme(): void {
  const saved = localStorage.getItem("theme");
  if (
    saved === "dark" ||
    (!saved && matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.body.classList.add("dark-mode");
  }
}

function toggleTheme(): void {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// ─── Modal de configuración ──────────────────────────────
function openSettings(): void {
  ollamaHostInput.value = localStorage.getItem("ollamaHost") || "localhost";
  ollamaPortInput.value = localStorage.getItem("ollamaPort") || "11434";
  updateUrlPreview();
  testResult.textContent = "";
  settingsModal.classList.add("active");
}

function closeSettings(): void {
  settingsModal.classList.remove("active");
}

function updateUrlPreview(): void {
  urlPreview.textContent = `http://${ollamaHostInput.value || "localhost"}:${ollamaPortInput.value || "11434"}`;
}

async function testConnection(): Promise<void> {
  testResult.textContent = "Probando…";
  const url = `http://${ollamaHostInput.value}:${ollamaPortInput.value}`;
  try {
    const data = await apiPost<{ models: OllamaModel[] }>("/api/models", {
      ollamaUrl: url,
    });
    testResult.textContent = `✅ Conexión exitosa — ${data.models.length} modelo(s) encontrado(s)`;
    testResult.style.color = "var(--success-color, #28a745)";
  } catch {
    testResult.textContent = "❌ No se pudo conectar. Verifica host y puerto.";
    testResult.style.color = "var(--error-color, #dc3545)";
  }
}

function saveSettings(): void {
  localStorage.setItem("ollamaHost", ollamaHostInput.value || "localhost");
  localStorage.setItem("ollamaPort", ollamaPortInput.value || "11434");
  closeSettings();
  loadModels();
}

// ─── Prompt Templates ────────────────────────────────────
interface PromptTemplate {
  id: string;
  name: string;
  text: string;
  builtin?: boolean;
}

const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: "builtin-1",
    name: "Explicar código",
    text: "Explica este código paso a paso: ",
    builtin: true,
  },
  {
    id: "builtin-2",
    name: "Traducir al inglés",
    text: "Traduce al inglés: ",
    builtin: true,
  },
  {
    id: "builtin-3",
    name: "Resumir texto",
    text: "Resume el siguiente texto: ",
    builtin: true,
  },
  {
    id: "builtin-4",
    name: "Encontrar errores",
    text: "Encuentra errores en: ",
    builtin: true,
  },
  {
    id: "builtin-5",
    name: "Tests unitarios",
    text: "Genera tests unitarios para: ",
    builtin: true,
  },
  {
    id: "builtin-6",
    name: "Refactorizar",
    text: "Refactoriza el siguiente código para mejorar su legibilidad: ",
    builtin: true,
  },
  {
    id: "builtin-7",
    name: "Documentar función",
    text: "Genera documentación para la siguiente función: ",
    builtin: true,
  },
  {
    id: "builtin-8",
    name: "Explicar error",
    text: "Explica este error y cómo solucionarlo: ",
    builtin: true,
  },
];

let slashHighlightIndex = -1;

function loadTemplates(): PromptTemplate[] {
  const saved = localStorage.getItem("promptTemplates");
  const custom: PromptTemplate[] = saved ? JSON.parse(saved) : [];
  return [...DEFAULT_TEMPLATES, ...custom];
}

function saveCustomTemplates(templates: PromptTemplate[]): void {
  const custom = templates.filter((t) => !t.builtin);
  localStorage.setItem("promptTemplates", JSON.stringify(custom));
}

function openTemplatesDropdown(): void {
  templateSearchInput.value = "";
  renderTemplatesList("");
  promptTemplatesDropdown.classList.add("active");
  promptTemplatesBtn.classList.add("active");
  slashHighlightIndex = -1;
  setTimeout(() => templateSearchInput.focus(), 50);
}

function closeTemplatesDropdown(): void {
  promptTemplatesDropdown.classList.remove("active");
  promptTemplatesBtn.classList.remove("active");
  slashHighlightIndex = -1;
}

function toggleTemplatesDropdown(): void {
  if (promptTemplatesDropdown.classList.contains("active")) {
    closeTemplatesDropdown();
  } else {
    openTemplatesDropdown();
  }
}

function selectTemplate(template: PromptTemplate): void {
  messageInput.value = template.text;
  closeTemplatesDropdown();
  closeSlashDropdown();
  messageInput.focus();
  autoResize(messageInput);
}

function renderTemplatesList(filter: string): void {
  const templates = loadTemplates();
  const lowerFilter = filter.toLowerCase();
  const filtered = lowerFilter
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerFilter) ||
          t.text.toLowerCase().includes(lowerFilter),
      )
    : templates;

  if (filtered.length === 0) {
    promptTemplatesList.innerHTML =
      '<div class="no-templates">No se encontraron templates</div>';
    return;
  }

  promptTemplatesList.innerHTML = filtered
    .map(
      (t) => `
    <div class="prompt-template-item" data-template-id="${escapeHtml(t.id)}">
      <span class="template-icon">⚡</span>
      <div class="template-info">
        <span class="template-name">${escapeHtml(t.name)}</span>
        <span class="template-preview">${escapeHtml(t.text)}</span>
      </div>
      ${t.builtin ? '<span class="template-badge">predefinido</span>' : '<span class="template-badge">personalizado</span>'}
    </div>`,
    )
    .join("");

  promptTemplatesList
    .querySelectorAll(".prompt-template-item")
    .forEach((el) => {
      el.addEventListener("click", () => {
        const id = (el as HTMLElement).dataset.templateId;
        const tmpl = templates.find((t) => t.id === id);
        if (tmpl) selectTemplate(tmpl);
      });
    });
}

// ─── Slash commands (/) ──────────────────────────────────
let slashDropdown: HTMLDivElement | null = null;

function getOrCreateSlashDropdown(): HTMLDivElement {
  if (!slashDropdown) {
    slashDropdown = document.createElement("div");
    slashDropdown.className = "slash-command-dropdown";
    slashDropdown.id = "slashCommandDropdown";
    messageInput.parentElement!.appendChild(slashDropdown);
  }
  return slashDropdown;
}

function openSlashDropdown(filter: string): void {
  const dd = getOrCreateSlashDropdown();
  const templates = loadTemplates();
  const lowerFilter = filter.toLowerCase();
  const filtered = lowerFilter
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerFilter) ||
          t.text.toLowerCase().includes(lowerFilter),
      )
    : templates;

  if (filtered.length === 0) {
    dd.innerHTML = '<div class="no-templates">Sin resultados</div>';
    dd.classList.add("active");
    slashHighlightIndex = -1;
    return;
  }

  slashHighlightIndex = 0;

  dd.innerHTML = filtered
    .map(
      (t, i) => `
    <div class="prompt-template-item${i === 0 ? " highlighted" : ""}" data-template-id="${escapeHtml(t.id)}">
      <span class="template-icon">⚡</span>
      <div class="template-info">
        <span class="template-name">${escapeHtml(t.name)}</span>
        <span class="template-preview">${escapeHtml(t.text)}</span>
      </div>
    </div>`,
    )
    .join("");

  dd.classList.add("active");

  dd.querySelectorAll(".prompt-template-item").forEach((el) => {
    el.addEventListener("click", () => {
      const id = (el as HTMLElement).dataset.templateId;
      const tmpl = templates.find((t) => t.id === id);
      if (tmpl) {
        messageInput.value = tmpl.text;
        closeSlashDropdown();
        messageInput.focus();
        autoResize(messageInput);
      }
    });
  });
}

function closeSlashDropdown(): void {
  if (slashDropdown) {
    slashDropdown.classList.remove("active");
  }
  slashHighlightIndex = -1;
}

function isSlashDropdownActive(): boolean {
  return !!slashDropdown && slashDropdown.classList.contains("active");
}

function navigateSlashDropdown(direction: number): void {
  if (!slashDropdown) return;
  const items = slashDropdown.querySelectorAll(
    ".prompt-template-item[data-template-id]",
  );
  if (items.length === 0) return;
  items.forEach((el) => el.classList.remove("highlighted"));
  slashHighlightIndex =
    (slashHighlightIndex + direction + items.length) % items.length;
  items[slashHighlightIndex].classList.add("highlighted");
  (items[slashHighlightIndex] as HTMLElement).scrollIntoView({
    block: "nearest",
  });
}

function confirmSlashSelection(): void {
  if (!slashDropdown) return;
  const items = slashDropdown.querySelectorAll(
    ".prompt-template-item[data-template-id]",
  );
  if (slashHighlightIndex >= 0 && slashHighlightIndex < items.length) {
    (items[slashHighlightIndex] as HTMLElement).click();
  }
}

function handleSlashInput(): void {
  const val = messageInput.value;
  if (val.startsWith("/")) {
    const query = val.slice(1);
    openSlashDropdown(query);
  } else {
    closeSlashDropdown();
  }
}

// ─── Template management modal ───────────────────────────
function openTemplateModal(): void {
  closeTemplatesDropdown();
  templateNameInput.value = "";
  templateTextInput.value = "";
  renderTemplateManageList();
  templateModal.classList.add("active");
}

function closeTemplateModal(): void {
  templateModal.classList.remove("active");
}

function renderTemplateManageList(): void {
  const templates = loadTemplates();
  if (templates.length === 0) {
    templateManageList.innerHTML =
      '<div class="no-templates">No hay templates</div>';
    return;
  }
  templateManageList.innerHTML = templates
    .map(
      (t) => `
    <div class="template-manage-item">
      <div class="tmi-info">
        <span class="tmi-name">${escapeHtml(t.name)}</span>
        <span class="tmi-text">${escapeHtml(t.text)}</span>
      </div>
      ${t.builtin ? '<span class="tmi-badge">predefinido</span>' : `<button class="tmi-delete" data-delete-id="${escapeHtml(t.id)}" title="Eliminar">✕</button>`}
    </div>`,
    )
    .join("");

  templateManageList.querySelectorAll(".tmi-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).dataset.deleteId;
      if (!id) return;
      const all = loadTemplates().filter((t) => t.id !== id);
      saveCustomTemplates(all);
      renderTemplateManageList();
    });
  });
}

function addCustomTemplate(): void {
  const name = templateNameInput.value.trim();
  const text = templateTextInput.value.trim();
  if (!name || !text) return;

  const templates = loadTemplates();
  const newTemplate: PromptTemplate = {
    id: "custom-" + Date.now(),
    name,
    text,
  };
  templates.push(newTemplate);
  saveCustomTemplates(templates);
  templateNameInput.value = "";
  templateTextInput.value = "";
  renderTemplateManageList();
}

// ─── Event listeners ─────────────────────────────────────
sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (e) => {
  // Slash dropdown navigation
  if (isSlashDropdownActive()) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateSlashDropdown(1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateSlashDropdown(-1);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      confirmSlashSelection();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeSlashDropdown();
      return;
    }
  }

  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener("input", () => {
  autoResize(messageInput);
  handleSlashInput();
});

// Resize handle para el input
(function initResizeHandle(): void {
  const handle = $("resizeHandle") as HTMLElement | null;
  if (!handle) return;
  let startY = 0;
  let startMax = 0;

  let isDragging = false;

  function onPointerMove(e: PointerEvent): void {
    const delta = startY - e.clientY;
    const newMax = Math.min(
      Math.max(startMax + delta, 80),
      window.innerHeight * 0.6,
    );
    inputMaxHeight = newMax;
    messageInput.style.maxHeight = newMax + "px";
    messageInput.style.height = newMax + "px";
    messageInput.style.overflow = "auto";
  }

  function onPointerUp(): void {
    isDragging = false;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.body.style.userSelect = "";
  }

  handle.addEventListener("pointerdown", (e: PointerEvent) => {
    e.preventDefault();
    isDragging = true;
    startY = e.clientY;
    startMax = inputMaxHeight;
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  });
})();

toggleSidebarBtn.addEventListener("click", openSidebar);
closeSidebarBtn.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

// Búsqueda de chats con debounce
let chatSearchTimer: ReturnType<typeof setTimeout>;
chatSearchInput.addEventListener("input", () => {
  clearTimeout(chatSearchTimer);
  chatSearchTimer = setTimeout(() => refreshChatList(), 300);
});

newChatBtn.addEventListener("click", newChat);
clearBtn.addEventListener("click", clearChat);
exportBtn.addEventListener("click", openExportModal);
closeExportModalBtn.addEventListener("click", closeExportModal);
cancelExportBtn.addEventListener("click", closeExportModal);

// Botones de formato de exportación
document.querySelectorAll(".export-format-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const format = (btn as HTMLElement).dataset.format;
    if (format) exportChat(format);
  });
});

darkModeToggle.addEventListener("click", toggleTheme);

settingsBtn.addEventListener("click", openSettings);
closeSettingsModal.addEventListener("click", closeSettings);
cancelSettingsBtn.addEventListener("click", closeSettings);
saveSettingsBtn.addEventListener("click", saveSettings);
testConnectionBtn.addEventListener("click", testConnection);

ollamaHostInput.addEventListener("input", updateUrlPreview);
ollamaPortInput.addEventListener("input", updateUrlPreview);

// Panel de parámetros del modelo
modelParamsToggle.addEventListener("click", () => {
  const isVisible = modelParamsPanel.style.display !== "none";
  modelParamsPanel.style.display = isVisible ? "none" : "block";
  modelParamsToggle.classList.toggle("active", !isVisible);
});

enableModelParams.addEventListener("change", () => {
  modelParamsForm.classList.toggle("enabled", enableModelParams.checked);
});

resetParamsBtn.addEventListener("click", resetModelParams);

// Panel de instrucciones (system prompt)
systemPromptToggle.addEventListener("click", () => {
  const isVisible = systemPromptPanel.style.display !== "none";
  systemPromptPanel.style.display = isVisible ? "none" : "block";
  systemPromptToggle.classList.toggle("active", !isVisible);
});

enableSystemPrompt.addEventListener("change", () => {
  systemPromptForm.classList.toggle("enabled", enableSystemPrompt.checked);
  saveSystemPromptToStorage();
});

systemPromptInput.addEventListener("input", saveSystemPromptToStorage);

clearSystemPromptBtn.addEventListener("click", () => {
  systemPromptInput.value = "";
  saveSystemPromptToStorage();
});

// Botón de parar streaming
stopBtn.addEventListener("click", () => {
  if (abortController) {
    abortController.abort();
  }
});

// Cambio de modelo con botón Cargar + modal de confirmación
let pendingModel: string | null = null;

loadModelBtn.addEventListener("click", () => {
  const newModel = modelSelector.value;
  if (!newModel) return;

  // Si no hay chat activo, o el modelo es el mismo, simplemente aplicar
  if (!currentChatId || !currentChatModel || newModel === currentChatModel) {
    currentChatModel = newModel;
    loadModelInfo(newModel);
    newChat();
    return;
  }

  // Hay chat activo y el modelo es diferente → mostrar modal
  pendingModel = newModel;
  modelChangeModalText.textContent = `Al cambiar al modelo "${newModel}" se abrirá un nuevo chat. La conversación actual se mantendrá guardada. ¿Deseas continuar?`;
  modelChangeModal.classList.add("active");
});

modelChangeAcceptBtn.addEventListener("click", () => {
  modelChangeModal.classList.remove("active");
  if (pendingModel) {
    modelSelector.value = pendingModel;
    loadModelInfo(pendingModel);
    pendingModel = null;
    newChat();
  }
});

function closeModelChange(): void {
  modelChangeModal.classList.remove("active");
  if (currentChatModel) {
    modelSelector.value = currentChatModel;
  }
  pendingModel = null;
}

modelChangeCancelBtn.addEventListener("click", closeModelChange);
closeModelChangeModal.addEventListener("click", closeModelChange);

// Prompt templates events
promptTemplatesBtn.addEventListener("click", toggleTemplatesDropdown);

templateSearchInput.addEventListener("input", () => {
  renderTemplatesList(templateSearchInput.value);
});

manageTemplatesBtn.addEventListener("click", openTemplateModal);
closeTemplateModalBtn.addEventListener("click", closeTemplateModal);
cancelTemplateBtn.addEventListener("click", closeTemplateModal);
saveTemplateBtn.addEventListener("click", addCustomTemplate);

// Cerrar dropdown al hacer clic fuera
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (
    promptTemplatesDropdown.classList.contains("active") &&
    !promptTemplatesDropdown.contains(target) &&
    !promptTemplatesBtn.contains(target)
  ) {
    closeTemplatesDropdown();
  }
  if (
    isSlashDropdownActive() &&
    slashDropdown &&
    !slashDropdown.contains(target) &&
    target !== messageInput
  ) {
    closeSlashDropdown();
  }
});

// Cerrar modal con Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSettings();
    closeSidebar();
    closeModelChange();
    closeExportModal();
    closeTemplatesDropdown();
    closeSlashDropdown();
    closeTemplateModal();
  }
});

// ─── Inicialización ──────────────────────────────────────
initTheme();
loadModels();
refreshChatList();
initParamSync();
initParamTooltips();
loadSystemPromptFromStorage();

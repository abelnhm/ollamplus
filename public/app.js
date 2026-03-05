"use strict";
// ─── Estado global ───────────────────────────────────────
let currentChatId = null;
let currentChatModel = null;
let isStreaming = false;
let abortController = null;
// ─── Elementos del DOM ──────────────────────────────────
const $ = (id) => document.getElementById(id);
const chatMessages = $("chatMessages");
const messageInput = $("messageInput");
const sendBtn = $("sendBtn");
const sendIcon = $("sendIcon");
const sendText = $("sendText");
const modelSelector = $("modelSelector");
const modelStatus = $("modelStatus");
const sidebar = $("sidebar");
const sidebarOverlay = $("sidebarOverlay");
const chatsList = $("chatsList");
// Botones de cabecera
const toggleSidebarBtn = $("toggleSidebarBtn");
const closeSidebarBtn = $("closeSidebarBtn");
const newChatBtn = $("newChatBtn");
const exportBtn = $("exportBtn");
const clearBtn = $("clearBtn");
const settingsBtn = $("settingsBtn");
const darkModeToggle = $("darkModeToggle");
// Modal de configuración
const settingsModal = $("settingsModal");
const ollamaHostInput = $("ollamaHost");
const ollamaPortInput = $("ollamaPort");
const urlPreview = $("urlPreview");
const testConnectionBtn = $("testConnection");
const testResult = $("testResult");
const saveSettingsBtn = $("saveSettings");
const cancelSettingsBtn = $("cancelSettings");
const closeSettingsModal = $("closeSettingsModal");
// Barra de cambio de modelo
const loadModelBtn = $("loadModelBtn");
const modelChangeModal = $("modelChangeModal");
const modelChangeModalText = $("modelChangeModalText");
const modelChangeAcceptBtn = $("modelChangeAcceptBtn");
const modelChangeCancelBtn = $("modelChangeCancelBtn");
const closeModelChangeModal = $("closeModelChangeModal");
// Botón de parar
const stopBtn = $("stopBtn");
// Panel de parámetros del modelo
const modelParamsToggle = $("modelParamsToggle");
const modelParamsPanel = $("modelParamsPanel");
const enableModelParams = $("enableModelParams");
const modelParamsForm = $("modelParamsForm");
const resetParamsBtn = $("resetParamsBtn");
// Panel de instrucciones (system prompt)
const systemPromptToggle = $("systemPromptToggle");
const systemPromptPanel = $("systemPromptPanel");
const enableSystemPrompt = $("enableSystemPrompt");
const systemPromptForm = $("systemPromptForm");
const systemPromptInput = $("systemPromptInput");
const clearSystemPromptBtn = $("clearSystemPrompt");
// Panel de información del modelo
const modelInfoPanel = $("modelInfoPanel");
const modelInfoFamily = $("modelInfoFamily");
const modelInfoSize = $("modelInfoSize");
const modelInfoQuant = $("modelInfoQuant");
const modelInfoFormat = $("modelInfoFormat");
const modelInfoVramItem = $("modelInfoVramItem");
const modelInfoVram = $("modelInfoVram");
// ─── Helpers ─────────────────────────────────────────────
function getOllamaUrl() {
    const host = localStorage.getItem("ollamaHost") || "localhost";
    const port = localStorage.getItem("ollamaPort") || "11434";
    return `http://${host}:${port}`;
}
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
function formatMarkdown(text) {
    // marked y hljs se cargan desde CDN
    const marked = window.marked;
    const hljs = window.hljs;
    if (marked) {
        marked.setOptions({
            highlight(code, lang) {
                if (hljs && lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs ? hljs.highlightAuto(code).value : escapeHtml(code);
            },
            breaks: true,
        });
        return marked.parse(text);
    }
    return escapeHtml(text).replace(/\n/g, "<br>");
}
let inputMaxHeight = 150;
function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height =
        Math.min(textarea.scrollHeight, inputMaxHeight) + "px";
}
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
// ─── System Prompt ───────────────────────────────────────
function getSystemPrompt() {
    if (!enableSystemPrompt.checked)
        return null;
    const text = systemPromptInput.value.trim();
    return text || null;
}
function saveSystemPromptToStorage() {
    localStorage.setItem("systemPromptEnabled", enableSystemPrompt.checked ? "1" : "0");
    localStorage.setItem("systemPromptText", systemPromptInput.value);
}
function loadSystemPromptFromStorage() {
    const enabled = localStorage.getItem("systemPromptEnabled") === "1";
    const text = localStorage.getItem("systemPromptText") || "";
    enableSystemPrompt.checked = enabled;
    systemPromptInput.value = text;
    systemPromptForm.classList.toggle("enabled", enabled);
}
const PARAM_DEFAULTS = {
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
function getModelOptions() {
    if (!enableModelParams.checked)
        return null;
    const opts = {};
    const tempEl = document.getElementById("param_temperature_val");
    if (tempEl)
        opts.temperature = parseFloat(tempEl.value);
    const topPEl = document.getElementById("param_top_p_val");
    if (topPEl)
        opts.top_p = parseFloat(topPEl.value);
    const topKEl = document.getElementById("param_top_k");
    if (topKEl)
        opts.top_k = parseInt(topKEl.value, 10);
    const numCtxEl = document.getElementById("param_num_ctx");
    if (numCtxEl)
        opts.num_ctx = parseInt(numCtxEl.value, 10);
    const repeatEl = document.getElementById("param_repeat_penalty_val");
    if (repeatEl)
        opts.repeat_penalty = parseFloat(repeatEl.value);
    const seedEl = document.getElementById("param_seed");
    if (seedEl && seedEl.value !== "")
        opts.seed = parseInt(seedEl.value, 10);
    const numPredEl = document.getElementById("param_num_predict");
    if (numPredEl)
        opts.num_predict = parseInt(numPredEl.value, 10);
    const stopEl = document.getElementById("param_stop");
    if (stopEl && stopEl.value.trim() !== "") {
        opts.stop = stopEl.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    const mirostatEl = document.getElementById("param_mirostat");
    if (mirostatEl)
        opts.mirostat = parseInt(mirostatEl.value, 10);
    const mirostatTauEl = document.getElementById("param_mirostat_tau_val");
    if (mirostatTauEl)
        opts.mirostat_tau = parseFloat(mirostatTauEl.value);
    const mirostatEtaEl = document.getElementById("param_mirostat_eta_val");
    if (mirostatEtaEl)
        opts.mirostat_eta = parseFloat(mirostatEtaEl.value);
    return opts;
}
function resetModelParams() {
    const pairs = [
        ["param_temperature", "param_temperature_val"],
        ["param_top_p", "param_top_p_val"],
        ["param_repeat_penalty", "param_repeat_penalty_val"],
        ["param_mirostat_tau", "param_mirostat_tau_val"],
        ["param_mirostat_eta", "param_mirostat_eta_val"],
    ];
    for (const [rangeId, numId] of pairs) {
        const key = rangeId.replace("param_", "");
        const def = PARAM_DEFAULTS[key];
        document.getElementById(rangeId).value = String(def);
        document.getElementById(numId).value = String(def);
    }
    document.getElementById("param_top_k").value = String(PARAM_DEFAULTS.top_k);
    document.getElementById("param_num_ctx").value =
        String(PARAM_DEFAULTS.num_ctx);
    document.getElementById("param_seed").value = "";
    document.getElementById("param_num_predict").value =
        String(PARAM_DEFAULTS.num_predict);
    document.getElementById("param_stop").value = "";
    document.getElementById("param_mirostat").value =
        String(PARAM_DEFAULTS.mirostat);
}
function initParamSync() {
    const pairs = [
        ["param_temperature", "param_temperature_val"],
        ["param_top_p", "param_top_p_val"],
        ["param_repeat_penalty", "param_repeat_penalty_val"],
        ["param_mirostat_tau", "param_mirostat_tau_val"],
        ["param_mirostat_eta", "param_mirostat_eta_val"],
    ];
    for (const [rangeId, numId] of pairs) {
        const range = document.getElementById(rangeId);
        const num = document.getElementById(numId);
        range.addEventListener("input", () => {
            num.value = range.value;
        });
        num.addEventListener("input", () => {
            range.value = num.value;
        });
    }
}
function initParamTooltips() {
    let activeTooltip = null;
    function removeTooltip() {
        if (activeTooltip) {
            activeTooltip.remove();
            activeTooltip = null;
        }
    }
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".param-help-btn");
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
        if (left < 8)
            left = 8;
        if (left + 280 > window.innerWidth)
            left = window.innerWidth - 288;
        if (top + 100 > window.innerHeight)
            top = rect.top - tip.offsetHeight - 6;
        tip.style.top = top + "px";
        tip.style.left = left + "px";
        activeTooltip = tip;
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape")
            removeTooltip();
    });
}
// ─── API helpers ─────────────────────────────────────────
async function apiPost(path, body) {
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
async function apiGet(path) {
    const res = await fetch(path);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
    }
    return res.json();
}
async function apiDelete(path) {
    const res = await fetch(path, { method: "DELETE" });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
    }
}
function formatBytes(bytes) {
    if (bytes === 0)
        return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
async function loadModelInfo(modelName) {
    modelInfoPanel.style.display = "none";
    if (!modelName)
        return;
    try {
        const data = await apiPost("/api/model-info", {
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
        }
        else {
            modelInfoVramItem.style.display = "none";
        }
        modelInfoPanel.style.display = "";
    }
    catch (err) {
        console.error("Error cargando info del modelo:", err);
        modelInfoPanel.style.display = "none";
    }
}
// ─── Modelos ─────────────────────────────────────────────
async function loadModels() {
    modelStatus.textContent = "Cargando…";
    try {
        const data = await apiPost("/api/models", {
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
    }
    catch (err) {
        modelSelector.innerHTML =
            '<option value="">Error al cargar modelos</option>';
        modelStatus.textContent = "❌ Sin conexión";
        console.error("Error cargando modelos:", err);
    }
}
// ─── Renderizado de mensajes ─────────────────────────────
function copyMessageToClipboard(btn, wrapper) {
    const text = wrapper.querySelector(".streaming-text")?.textContent ||
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
function addCopyButton(wrapper) {
    const btn = document.createElement("button");
    btn.className = "copy-msg-btn";
    btn.title = "Copiar al portapapeles";
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    btn.addEventListener("click", () => copyMessageToClipboard(btn, wrapper));
    wrapper.querySelector(".message-content").appendChild(btn);
}
function addMessageToUI(role, content) {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${role}`;
    const inner = document.createElement("div");
    inner.className = "message-content";
    const label = role === "user" ? "👤 Tú" : "🤖 Asistente";
    inner.innerHTML = `<strong>${label}:</strong>${formatMarkdown(content)}`;
    wrapper.appendChild(inner);
    chatMessages.appendChild(wrapper);
    if (role === "assistant") {
        addCopyButton(wrapper);
    }
    scrollToBottom();
    return wrapper;
}
function createStreamingMessage() {
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
function updateStreamingMessage(wrapper, text) {
    const thinking = wrapper.querySelector(".thinking-indicator");
    const span = wrapper.querySelector(".streaming-text");
    if (thinking) {
        thinking.remove();
    }
    if (span) {
        span.style.display = "";
        span.innerHTML = formatMarkdown(text);
    }
    scrollToBottom();
}
// ─── Envío de mensaje (streaming SSE) ────────────────────
async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || isStreaming)
        return;
    const model = modelSelector.value;
    if (!model) {
        alert("Selecciona un modelo primero.");
        return;
    }
    // Si no hay chat activo, crear uno
    if (!currentChatId) {
        const title = content.substring(0, 40) + (content.length > 40 ? "…" : "");
        try {
            const data = await apiPost("/api/new-chat", {
                model,
                title,
            });
            currentChatId = data.chat.id;
        }
        catch (err) {
            console.error("Error creando chat:", err);
            alert("No se pudo crear el chat.");
            return;
        }
    }
    // Mostrar mensaje del usuario
    addMessageToUI("user", content);
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
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
                if (!line.startsWith("data: "))
                    continue;
                const jsonStr = line.slice(6);
                try {
                    const data = JSON.parse(jsonStr);
                    if (data.error) {
                        fullText += `\n\n**Error:** ${data.error}`;
                        updateStreamingMessage(streamWrapper, fullText);
                    }
                    else if (data.done) {
                        fullText = data.fullResponse || fullText;
                        updateStreamingMessage(streamWrapper, fullText);
                    }
                    else if (data.chunk) {
                        fullText += data.chunk;
                        updateStreamingMessage(streamWrapper, fullText);
                    }
                }
                catch {
                    // ignorar líneas no JSON
                }
            }
        }
    }
    catch (err) {
        if (err.name === "AbortError") {
            fullText += "\n\n*Respuesta detenida por el usuario.*";
        }
        else {
            fullText += `\n\n**Error de conexión:** ${err.message}`;
        }
        updateStreamingMessage(streamWrapper, fullText);
    }
    finally {
        isStreaming = false;
        abortController = null;
        sendBtn.disabled = false;
        sendBtn.style.display = "";
        stopBtn.style.display = "none";
        sendBtn.classList.remove("loading");
        sendText.textContent = "Enviar";
        addCopyButton(streamWrapper);
        refreshChatList();
    }
}
// ─── Sidebar: lista de chats ─────────────────────────────
async function refreshChatList() {
    try {
        const data = await apiGet("/api/chats");
        if (data.chats.length === 0) {
            chatsList.innerHTML =
                '<div class="no-chats">No hay chats guardados</div>';
            return;
        }
        chatsList.innerHTML = "";
        // Ordenar por fecha descendente
        data.chats
            .sort((a, b) => new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime())
            .forEach((chat) => {
            const item = document.createElement("div");
            item.className = `chat-item${chat.id === currentChatId ? " active" : ""}`;
            item.innerHTML = `
          <div class="chat-item-title">${escapeHtml(chat.title)}</div>
          <div class="chat-item-meta">${chat.model} · ${chat.messageCount} msgs</div>
        `;
            item.addEventListener("click", () => loadChat(chat.id));
            chatsList.appendChild(item);
        });
    }
    catch (err) {
        console.error("Error cargando chats:", err);
    }
}
async function loadChat(chatId) {
    try {
        const data = await apiGet(`/api/chats/${chatId}`);
        currentChatId = chatId;
        currentChatModel = data.chat.model;
        // Seleccionar el modelo del chat
        modelSelector.value = data.chat.model;
        loadModelInfo(data.chat.model);
        // Limpiar mensajes y renderizar los existentes
        chatMessages.innerHTML = "";
        data.chat.messages.forEach((msg) => addMessageToUI(msg.role, msg.content));
        closeSidebar();
        refreshChatList();
    }
    catch (err) {
        console.error("Error cargando chat:", err);
    }
}
// ─── Acciones de cabecera ────────────────────────────────
function newChat() {
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
    closeSidebar();
}
function clearChat() {
    if (!currentChatId) {
        newChat();
        return;
    }
    if (!confirm("¿Eliminar este chat?"))
        return;
    apiDelete(`/api/chats/${currentChatId}`)
        .then(() => {
        newChat();
        refreshChatList();
    })
        .catch((err) => console.error("Error eliminando chat:", err));
}
// ─── Modal de exportación ─────────────────────────────────
const exportModal = $("exportModal");
const closeExportModalBtn = $("closeExportModal");
const cancelExportBtn = $("cancelExportBtn");
function openExportModal() {
    if (!currentChatId) {
        alert("No hay conversación activa para exportar.");
        return;
    }
    exportModal.classList.add("active");
}
function closeExportModal() {
    exportModal.classList.remove("active");
}
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
async function getChatData() {
    if (!currentChatId)
        return null;
    try {
        const data = await apiGet(`/api/chats/${currentChatId}`);
        return data.chat;
    }
    catch {
        return null;
    }
}
function exportAsMarkdown(chat) {
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
function exportAsJSON(chat) {
    return JSON.stringify(chat, null, 2);
}
function exportAsHTML(chat) {
    const dateStr = new Date(chat.createdAt).toLocaleString();
    const messagesHtml = chat.messages.map((msg) => {
        const role = msg.role === "user" ? "👤 Usuario" : "🤖 Asistente";
        const bgColor = msg.role === "user" ? "#e3f2fd" : "#f5f5f5";
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const contentEscaped = escapeHtml(msg.content).replace(/\n/g, "<br>");
        return `<div style="background:${bgColor};border-radius:8px;padding:12px 16px;margin-bottom:12px;">
      <strong>${role}</strong> <small style="color:#888">${time}</small>
      <div style="margin-top:8px;white-space:pre-wrap;">${contentEscaped}</div>
    </div>`;
    }).join("\n");
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
function exportAsPDF(chat) {
    const htmlContent = exportAsHTML(chat);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        alert("No se pudo abrir la ventana de impresión. Permite las ventanas emergentes.");
        return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.addEventListener("load", () => {
        printWindow.print();
    });
}
async function exportChat(format) {
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
function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("active");
    refreshChatList();
}
function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
}
// ─── Tema oscuro ─────────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" ||
        (!saved && matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.body.classList.add("dark-mode");
    }
}
function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}
// ─── Modal de configuración ──────────────────────────────
function openSettings() {
    ollamaHostInput.value = localStorage.getItem("ollamaHost") || "localhost";
    ollamaPortInput.value = localStorage.getItem("ollamaPort") || "11434";
    updateUrlPreview();
    testResult.textContent = "";
    settingsModal.classList.add("active");
}
function closeSettings() {
    settingsModal.classList.remove("active");
}
function updateUrlPreview() {
    urlPreview.textContent = `http://${ollamaHostInput.value || "localhost"}:${ollamaPortInput.value || "11434"}`;
}
async function testConnection() {
    testResult.textContent = "Probando…";
    const url = `http://${ollamaHostInput.value}:${ollamaPortInput.value}`;
    try {
        const data = await apiPost("/api/models", {
            ollamaUrl: url,
        });
        testResult.textContent = `✅ Conexión exitosa — ${data.models.length} modelo(s) encontrado(s)`;
        testResult.style.color = "var(--success-color, #28a745)";
    }
    catch {
        testResult.textContent = "❌ No se pudo conectar. Verifica host y puerto.";
        testResult.style.color = "var(--error-color, #dc3545)";
    }
}
function saveSettings() {
    localStorage.setItem("ollamaHost", ollamaHostInput.value || "localhost");
    localStorage.setItem("ollamaPort", ollamaPortInput.value || "11434");
    closeSettings();
    loadModels();
}
// ─── Event listeners ─────────────────────────────────────
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
messageInput.addEventListener("input", () => autoResize(messageInput));
// Resize handle para el input
(function initResizeHandle() {
    const handle = $("resizeHandle");
    if (!handle)
        return;
    let startY = 0;
    let startMax = 0;
    let isDragging = false;
    function onPointerMove(e) {
        const delta = startY - e.clientY;
        const newMax = Math.min(Math.max(startMax + delta, 80), window.innerHeight * 0.6);
        inputMaxHeight = newMax;
        messageInput.style.maxHeight = newMax + "px";
        messageInput.style.height = newMax + "px";
        messageInput.style.overflow = "auto";
    }
    function onPointerUp() {
        isDragging = false;
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        document.body.style.userSelect = "";
    }
    handle.addEventListener("pointerdown", (e) => {
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
newChatBtn.addEventListener("click", newChat);
clearBtn.addEventListener("click", clearChat);
exportBtn.addEventListener("click", openExportModal);
closeExportModalBtn.addEventListener("click", closeExportModal);
cancelExportBtn.addEventListener("click", closeExportModal);
// Botones de formato de exportación
document.querySelectorAll(".export-format-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const format = btn.dataset.format;
        if (format)
            exportChat(format);
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
});
enableModelParams.addEventListener("change", () => {
    modelParamsForm.classList.toggle("enabled", enableModelParams.checked);
});
resetParamsBtn.addEventListener("click", resetModelParams);
// Panel de instrucciones (system prompt)
systemPromptToggle.addEventListener("click", () => {
    const isVisible = systemPromptPanel.style.display !== "none";
    systemPromptPanel.style.display = isVisible ? "none" : "block";
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
let pendingModel = null;
loadModelBtn.addEventListener("click", () => {
    const newModel = modelSelector.value;
    if (!newModel)
        return;
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
function closeModelChange() {
    modelChangeModal.classList.remove("active");
    if (currentChatModel) {
        modelSelector.value = currentChatModel;
    }
    pendingModel = null;
}
modelChangeCancelBtn.addEventListener("click", closeModelChange);
closeModelChangeModal.addEventListener("click", closeModelChange);
// Cerrar modal con Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeSettings();
        closeSidebar();
        closeModelChange();
        closeExportModal();
    }
});
// ─── Inicialización ──────────────────────────────────────
initTheme();
loadModels();
refreshChatList();
initParamSync();
initParamTooltips();
loadSystemPromptFromStorage();
//# sourceMappingURL=app.js.map
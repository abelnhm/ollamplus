"use strict";
// ─── Estado global ───────────────────────────────────────
let currentChatId = null;
let isStreaming = false;
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
function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
}
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
function addMessageToUI(role, content) {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${role}`;
    const inner = document.createElement("div");
    inner.className = "message-content";
    const label = role === "user" ? "👤 Tú" : "🤖 Asistente";
    inner.innerHTML = `<strong>${label}:</strong>${formatMarkdown(content)}`;
    wrapper.appendChild(inner);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
}
function createStreamingMessage() {
    const wrapper = document.createElement("div");
    wrapper.className = "message assistant";
    const inner = document.createElement("div");
    inner.className = "message-content";
    inner.innerHTML = "<strong>🤖 Asistente:</strong><span class='streaming-text'></span>";
    wrapper.appendChild(inner);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
}
function updateStreamingMessage(wrapper, text) {
    const span = wrapper.querySelector(".streaming-text");
    if (span) {
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
    sendBtn.disabled = true;
    sendText.textContent = "…";
    const streamWrapper = createStreamingMessage();
    let fullText = "";
    try {
        const res = await fetch(`/api/chat/${currentChatId}/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, ollamaUrl: getOllamaUrl() }),
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
        fullText += `\n\n**Error de conexión:** ${err.message}`;
        updateStreamingMessage(streamWrapper, fullText);
    }
    finally {
        isStreaming = false;
        sendBtn.disabled = false;
        sendText.textContent = "Enviar";
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
        // Seleccionar el modelo del chat
        modelSelector.value = data.chat.model;
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
    chatMessages.innerHTML = `
    <div class="message assistant">
      <div class="message-content">
        <strong>🤖 Asistente:</strong>
        <p>¡Hola! Soy tu asistente de IA. Selecciona un modelo y ¿en qué puedo ayudarte hoy?</p>
      </div>
    </div>`;
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
function exportChat() {
    const messages = chatMessages.innerText;
    if (!messages.trim())
        return;
    const blob = new Blob([messages], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
    if (saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches)) {
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
toggleSidebarBtn.addEventListener("click", openSidebar);
closeSidebarBtn.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);
newChatBtn.addEventListener("click", newChat);
clearBtn.addEventListener("click", clearChat);
exportBtn.addEventListener("click", exportChat);
darkModeToggle.addEventListener("click", toggleTheme);
settingsBtn.addEventListener("click", openSettings);
closeSettingsModal.addEventListener("click", closeSettings);
cancelSettingsBtn.addEventListener("click", closeSettings);
saveSettingsBtn.addEventListener("click", saveSettings);
testConnectionBtn.addEventListener("click", testConnection);
ollamaHostInput.addEventListener("input", updateUrlPreview);
ollamaPortInput.addEventListener("input", updateUrlPreview);
// Cerrar modal con Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeSettings();
        closeSidebar();
    }
});
// ─── Inicialización ──────────────────────────────────────
initTheme();
loadModels();
refreshChatList();
//# sourceMappingURL=app.js.map
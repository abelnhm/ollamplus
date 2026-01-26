const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const newChatBtn = document.getElementById("newChatBtn");
const modelSelector = document.getElementById("modelSelector");
const modelStatus = document.getElementById("modelStatus");
const sendIcon = document.getElementById("sendIcon");
const sendText = document.getElementById("sendText");
const darkModeToggle = document.getElementById("darkModeToggle");

// Elementos del sidebar
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const chatsList = document.getElementById("chatsList");

// Elementos de configuración
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsModal = document.getElementById("closeSettingsModal");
const cancelSettings = document.getElementById("cancelSettings");
const saveSettings = document.getElementById("saveSettings");
const testConnectionBtn = document.getElementById("testConnection");
const ollamaHost = document.getElementById("ollamaHost");
const ollamaPort = document.getElementById("ollamaPort");
const urlPreview = document.getElementById("urlPreview");

let sessionId = "user_" + Math.random().toString(36).substring(7);
let isProcessing = false;
let conversationData = []; // Almacenar la conversación
let currentModel = null;
let availableModels = [];
let allChats = []; // Lista de todos los chats guardados

// Configuración de Ollama
function getOllamaConfig() {
  const savedHost = localStorage.getItem("ollamaHost") || "localhost";
  const savedPort = localStorage.getItem("ollamaPort") || "11434";
  return {
    host: savedHost,
    port: savedPort,
    url: `http://${savedHost}:${savedPort}`,
  };
}

function saveOllamaConfig(host, port) {
  localStorage.setItem("ollamaHost", host);
  localStorage.setItem("ollamaPort", port);
}

function updateUrlPreview() {
  const host = ollamaHost.value || "localhost";
  const port = ollamaPort.value || "11434";
  urlPreview.textContent = `http://${host}:${port}`;
}

function openSettingsModal() {
  const config = getOllamaConfig();
  ollamaHost.value = config.host;
  ollamaPort.value = config.port;
  updateUrlPreview();
  settingsModal.classList.add("active");
}

function closeSettingsModalFunc() {
  settingsModal.classList.remove("active");
}

async function testConnection() {
  const testBtn = document.getElementById("testConnection");
  const testResult = document.getElementById("testResult");
  const host = ollamaHost.value.trim() || "localhost";
  const port = ollamaPort.value.trim() || "11434";
  const testUrl = `http://${host}:${port}`;

  testBtn.disabled = true;
  testBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 8px; animation: spin 1s linear infinite;">
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
    Probando...
  `;
  testResult.textContent = "";
  testResult.className = "";

  try {
    const response = await fetch("/api/models", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ollamaUrl: testUrl }),
    });

    const data = await response.json();

    if (response.ok && data.models) {
      testResult.textContent = `✓ Conexión exitosa! ${data.models.length} modelo(s) encontrado(s)`;
      testResult.className = "success";
    } else {
      throw new Error(data.error || data.details || "Error desconocido");
    }
  } catch (error) {
    testResult.textContent = `✗ Error: ${error.message}`;
    testResult.className = "error";
    console.error("Error en prueba de conexión:", error);
  } finally {
    testBtn.disabled = false;
    testBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 8px;">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
      Probar Conexión
    `;
  }
}

function saveSettingsFunc() {
  const host = ollamaHost.value.trim() || "localhost";
  const port = ollamaPort.value.trim() || "11434";

  saveOllamaConfig(host, port);
  closeSettingsModalFunc();

  // Recargar modelos con la nueva configuración
  loadAvailableModels();

  alert("Configuración guardada correctamente");
}

// Dark mode functionality
function initDarkMode() {
  // Check for saved preference or default to light mode
  const savedMode = localStorage.getItem("darkMode");
  if (savedMode === "enabled") {
    document.body.classList.add("dark-mode");
    updateDarkModeIcon();
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("darkMode", "enabled");
  } else {
    localStorage.setItem("darkMode", "disabled");
  }

  updateDarkModeIcon();
}

function updateDarkModeIcon() {
  const themeIcon = darkModeToggle.querySelector(".theme-icon");
  const isDark = document.body.classList.contains("dark-mode");

  if (isDark) {
    // Moon icon (dark mode active)
    themeIcon.innerHTML =
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  } else {
    // Sun icon (light mode active)
    themeIcon.innerHTML =
      '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  }
}

// Initialize dark mode on page load
initDarkMode();

// Configurar marked para renderizar markdown
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {}
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

// Auto-resize textarea
messageInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// Enviar mensaje con Enter (Shift+Enter para nueva línea)
messageInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Botón enviar
sendBtn.addEventListener("click", sendMessage);

// Botón limpiar
clearBtn.addEventListener("click", clearChat);

// Botón exportar
exportBtn.addEventListener("click", exportToMarkdown);

// Botón nueva conversación
newChatBtn.addEventListener("click", createNewChat);

// Selector de modelo
modelSelector.addEventListener("change", handleModelChange);

// Eventos del sidebar
toggleSidebarBtn.addEventListener("click", toggleSidebar);
closeSidebarBtn.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

// Dark mode toggle
darkModeToggle.addEventListener("click", toggleDarkMode);

// Settings modal events
settingsBtn.addEventListener("click", openSettingsModal);
closeSettingsModal.addEventListener("click", closeSettingsModalFunc);
cancelSettings.addEventListener("click", closeSettingsModalFunc);
saveSettings.addEventListener("click", saveSettingsFunc);
testConnectionBtn.addEventListener("click", testConnection);
ollamaHost.addEventListener("input", updateUrlPreview);
ollamaPort.addEventListener("input", updateUrlPreview);

// Cerrar modal al hacer clic fuera
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    closeSettingsModalFunc();
  }
});

// Cargar modelos disponibles al iniciar
loadAvailableModels();

// Cargar lista de chats
loadChats();

async function sendMessage() {
  const message = messageInput.value.trim();

  if (!message || isProcessing) return;

  // Validar que hay un modelo seleccionado
  if (!currentModel) {
    alert("Por favor, selecciona un modelo primero");
    modelSelector.focus();
    return;
  }

  // Guardar mensaje del usuario en conversación
  conversationData.push({
    role: "user",
    content: message,
  });

  // Agregar mensaje del usuario
  addMessage("user", message);
  messageInput.value = "";
  messageInput.style.height = "auto";

  // Deshabilitar input mientras procesa
  isProcessing = true;
  sendBtn.disabled = true;
  messageInput.disabled = true;
  sendIcon.innerHTML = `<circle cx="12" cy="12" r="10" style="opacity: 0.25;"></circle>
    <path d="M12 6v6l4 2" style="stroke-linecap: round;"></path>`;
  sendText.textContent = "Procesando...";

  // Crear mensaje del asistente
  const assistantMessageDiv = createMessageElement("assistant", "");
  const messageContent = assistantMessageDiv.querySelector(".message-content");

  // Buscar el contenedor markdown que ya fue creado
  const contentDiv = messageContent.querySelector(".markdown-content");

  // Agregar indicador de escritura
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "typing-indicator";
  typingIndicator.innerHTML = "<span></span><span></span><span></span>";
  contentDiv.appendChild(typingIndicator);

  try {
    const config = getOllamaConfig();
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        sessionId,
        model: currentModel,
        ollamaUrl: config.url,
      }),
    });

    if (!response.ok) {
      throw new Error("Error en la respuesta del servidor");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    // Eliminar indicador de escritura
    typingIndicator.remove();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.substring(6));

          if (data.chunk) {
            fullResponse += data.chunk;

            // Renderizar markdown en tiempo real
            contentDiv.innerHTML = marked.parse(fullResponse);

            // Auto-scroll
            chatMessages.scrollTop = chatMessages.scrollHeight;
          } else if (data.done) {
            console.log("✅ Respuesta completa recibida");
            // Guardar en conversación
            conversationData.push({
              role: "assistant",
              content: fullResponse,
            });
          } else if (data.error) {
            throw new Error(data.error);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
    contentDiv.innerHTML =
      "<p>❌ Error al comunicarse con el servidor. Por favor, intenta de nuevo.</p>";
  } finally {
    // Rehabilitar input
    isProcessing = false;
    sendBtn.disabled = false;
    messageInput.disabled = false;
    messageInput.focus();
    sendIcon.innerHTML = `<line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>`;
    sendText.textContent = "Enviar";

    // Auto-scroll final
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Actualizar lista de chats después de enviar mensaje
    loadChats();
  }
}

function addMessage(role, content) {
  const messageDiv = createMessageElement(role, content);

  // Si es un mensaje del asistente, renderizar markdown
  if (role === "assistant") {
    const contentElement = messageDiv.querySelector(
      ".message-content .markdown-content, .message-content p",
    );
    if (contentElement) {
      contentElement.innerHTML = marked.parse(content);
    }
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function createMessageElement(role, content) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  const strong = document.createElement("strong");
  strong.textContent = role === "user" ? "Tú:" : "Asistente:";

  // Para mensajes del asistente, usar div para markdown
  // Para mensajes del usuario, usar p normal
  const contentElement = document.createElement(
    role === "assistant" ? "div" : "p",
  );
  if (role === "assistant") {
    contentElement.className = "markdown-content";
    // Solo parsear si hay contenido
    if (content) {
      contentElement.innerHTML = marked.parse(content);
    }
  } else {
    contentElement.textContent = content;
  }

  messageContent.appendChild(strong);
  messageContent.appendChild(contentElement);
  messageDiv.appendChild(messageContent);
  chatMessages.appendChild(messageDiv);

  return messageDiv;
}

async function clearChat() {
  if (!confirm("¿Estás seguro de que quieres limpiar el historial del chat?")) {
    return;
  }

  try {
    await fetch("/api/clear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });

    // Limpiar UI y datos
    conversationData = [];
    chatMessages.innerHTML = `
            <div class="message assistant">
                <div class="message-content">
                    <strong>Asistente:</strong>
                    <p>Historial limpiado. ¿En qué puedo ayudarte?</p>
                </div>
            </div>
        `;

    messageInput.focus();
  } catch (error) {
    console.error("Error al limpiar:", error);
    alert("Error al limpiar el historial");
  }
}

function exportToMarkdown() {
  if (conversationData.length === 0) {
    alert("No hay conversación para exportar");
    return;
  }

  // Crear contenido markdown
  let markdownContent = `# Conversación con Ollama\n\n`;
  markdownContent += `**Fecha:** ${new Date().toLocaleString("es-ES")}\n\n`;
  markdownContent += `---\n\n`;

  conversationData.forEach((message, index) => {
    if (message.role === "user") {
      markdownContent += `## 👤 Usuario\n\n`;
      markdownContent += `${message.content}\n\n`;
    } else {
      markdownContent += `## 🤖 Asistente\n\n`;
      markdownContent += `${message.content}\n\n`;
    }

    if (index < conversationData.length - 1) {
      markdownContent += `---\n\n`;
    }
  });

  // Crear blob y descargar
  const blob = new Blob([markdownContent], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  // Nombre del archivo con fecha
  const filename = `conversacion-ollama-${new Date().toISOString().split("T")[0]}.md`;

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`✅ Conversación exportada como ${filename}`);
}

// Cargar modelos disponibles
async function loadAvailableModels() {
  try {
    modelStatus.textContent = "Cargando...";
    console.log("📋 Cargando modelos de Ollama...");

    const config = getOllamaConfig();
    const response = await fetch("/api/models", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ollamaUrl: config.url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.details || errorData.error || "Error al cargar modelos",
      );
    }

    const data = await response.json();
    console.log("✅ Datos recibidos:", data);

    if (data.models && data.models.length > 0) {
      availableModels = data.models;
      modelSelector.innerHTML = "";

      // Agregar opción por defecto
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Selecciona un modelo";
      modelSelector.appendChild(defaultOption);

      // Agregar cada modelo
      data.models.forEach((model) => {
        const option = document.createElement("option");
        option.value = model.name;
        option.textContent = model.name;
        modelSelector.appendChild(option);
      });

      modelStatus.textContent = `${data.models.length} modelo(s) disponible(s)`;
      console.log(`✅ ${data.models.length} modelo(s) cargado(s)`);
    } else {
      modelSelector.innerHTML =
        '<option value="">No hay modelos instalados</option>';
      modelStatus.textContent = "⚠️ Sin modelos";
      console.warn("⚠️ No se encontraron modelos instalados");
      alert(
        "No se encontraron modelos de Ollama instalados.\n\nPara instalar un modelo, ejecuta en la terminal:\nollama pull llama2",
      );
    }
  } catch (error) {
    console.error("❌ Error al cargar modelos:", error);
    modelSelector.innerHTML =
      '<option value="">Error al cargar modelos</option>';
    modelStatus.textContent = "❌ Error";

    const config = getOllamaConfig();
    let errorMsg = "Error al cargar los modelos.\n\n";

    if (
      error.message &&
      (error.message.includes("JSON") || error.message.includes("<!DOCTYPE"))
    ) {
      errorMsg += `No se pudo conectar a Ollama en ${config.url}\n\n`;
      errorMsg += "Verifica que:\n";
      errorMsg += "1. La dirección IP/host sea correcta\n";
      errorMsg += "2. Ollama esté ejecutándose en esa máquina\n";
      errorMsg += "3. El puerto sea el correcto (por defecto 11434)\n";
      errorMsg += "4. No haya firewall bloqueando la conexión";
    } else {
      errorMsg += error.message || "Error desconocido";
    }

    alert(errorMsg);
  }
}

// Manejar cambio de modelo
async function handleModelChange() {
  const selectedModel = modelSelector.value;

  if (!selectedModel) {
    return;
  }

  if (conversationData.length > 0) {
    const confirmChange = confirm(
      "Cambiar de modelo creará una nueva conversación. ¿Deseas continuar?",
    );
    if (!confirmChange) {
      // Restaurar selección anterior
      modelSelector.value = currentModel || "";
      return;
    }
  }

  currentModel = selectedModel;
  await createNewChatWithModel(selectedModel);
  modelStatus.textContent = `✅ ${selectedModel}`;
}

// Crear nueva conversación con modelo específico
async function createNewChatWithModel(model) {
  try {
    sessionId = "user_" + Math.random().toString(36).substring(7);

    const response = await fetch("/api/new-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId, model }),
    });

    const data = await response.json();

    if (data.success) {
      // Limpiar conversación actual
      conversationData = [];
      chatMessages.innerHTML = `
        <div class="message assistant">
          <div class="message-content">
            <strong>Asistente (${model}):</strong>
            <p>Nueva conversación iniciada con ${model}. ¿En qué puedo ayudarte?</p>
          </div>
        </div>
      `;
      messageInput.focus();
      console.log(`✅ Nueva conversación creada con ${model}`);

      // Actualizar lista de chats
      await loadChats();
    }
  } catch (error) {
    console.error("Error al crear nueva conversación:", error);
    alert("Error al crear nueva conversación");
  }
}

// Crear nueva conversación con modelo actual
async function createNewChat() {
  if (!currentModel) {
    alert("Por favor, selecciona un modelo primero");
    modelSelector.focus();
    return;
  }

  if (conversationData.length > 0) {
    const confirmNew = confirm(
      "¿Estás seguro de que quieres iniciar una nueva conversación? La actual se perderá si no la has exportado.",
    );
    if (!confirmNew) {
      return;
    }
  }

  await createNewChatWithModel(currentModel);
}

// Focus inicial
messageInput.focus();

// ==================== FUNCIONES DEL SIDEBAR ====================

function toggleSidebar() {
  sidebar.classList.toggle("active");
  sidebarOverlay.classList.toggle("active");
}

function closeSidebar() {
  sidebar.classList.remove("active");
  sidebarOverlay.classList.remove("active");
}

async function loadChats() {
  try {
    const response = await fetch("/api/chats");
    const data = await response.json();

    if (data.success) {
      allChats = data.chats;
      renderChatsList();
    }
  } catch (error) {
    console.error("Error al cargar chats:", error);
  }
}

function renderChatsList() {
  if (allChats.length === 0) {
    chatsList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.6);">
        <p>No hay chats guardados</p>
        <p style="font-size: 12px; margin-top: 8px;">Crea uno nuevo para comenzar</p>
      </div>
    `;
    return;
  }

  chatsList.innerHTML = allChats
    .map((chat) => {
      const date = new Date(chat.lastMessageAt || chat.createdAt);
      const formattedDate = formatDate(date);
      const isActive = chat.id === sessionId;

      return `
        <div class="chat-item ${isActive ? "active" : ""}" data-chat-id="${chat.id}" onclick="loadChat('${chat.id}')">
          <div class="chat-item-content">
            <div class="chat-item-title">${escapeHtml(chat.title)}</div>
            <div class="chat-item-date">${chat.messageCount || 0} mensajes • ${formattedDate}</div>
          </div>
          <button class="delete-chat-btn" onclick="event.stopPropagation(); deleteChat('${chat.id}')" title="Eliminar chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    })
    .join("");
}

async function loadChat(chatId) {
  try {
    const response = await fetch(`/api/chats/${chatId}`);
    const data = await response.json();

    if (data.success) {
      const chat = data.chat;

      // Actualizar sessionId y modelo actual
      sessionId = chat.id;
      currentModel = chat.model;

      // Actualizar selector de modelo
      modelSelector.value = chat.model;

      // Limpiar y cargar mensajes
      conversationData = chat.history || [];
      chatMessages.innerHTML = "";

      conversationData.forEach((msg) => {
        addMessage(msg.role, msg.content);
      });

      // Actualizar UI del sidebar
      renderChatsList();

      // Cerrar sidebar en mobile
      if (window.innerWidth <= 768) {
        closeSidebar();
      }

      messageInput.focus();
      console.log(`✅ Chat cargado: ${chat.title}`);
    }
  } catch (error) {
    console.error("Error al cargar chat:", error);
    alert("Error al cargar el chat");
  }
}

async function deleteChat(chatId) {
  const confirmDelete = confirm(
    "¿Estás seguro de que quieres eliminar este chat? Esta acción no se puede deshacer.",
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(`/api/chats/${chatId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.success) {
      // Si el chat eliminado es el actual, crear uno nuevo
      if (chatId === sessionId) {
        conversationData = [];
        chatMessages.innerHTML = "";
        sessionId = "user_" + Math.random().toString(36).substring(7);
      }

      // Recargar lista de chats
      await loadChats();
      console.log(`✅ Chat eliminado: ${chatId}`);
    }
  } catch (error) {
    console.error("Error al eliminar chat:", error);
    alert("Error al eliminar el chat");
  }
}

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Ahora";
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

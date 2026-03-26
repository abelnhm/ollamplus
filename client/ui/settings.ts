import type { OllamaModel } from "../types.js";
import { apiGet, apiPost, apiPut, apiDelete } from "../api.js";
import { getOllamaUrl } from "../utils.js";
import {
  settingsModal,
  ollamaHostInput,
  ollamaPortInput,
  urlPreview,
  testResult,
  ttsVoiceSelect,
  ttsSpeedRange,
  ttsSpeedValue,
} from "./elements.js";
import { state } from "../state.js";
import { loadModels } from "../services/modelService.js";
import { newChat, refreshChatList } from "../services/chatService.js";
import { loadVoices } from "../services/ttsVoices.js";

export function openSettings(): void {
  loadSettingsFromServer();
  settingsModal.classList.add("active");
}

export function closeSettings(): void {
  settingsModal.classList.remove("active");
}

export function updateUrlPreview(): void {
  urlPreview.textContent = `http://${ollamaHostInput.value || "localhost"}:${ollamaPortInput.value || "11434"}`;
}

export async function testConnection(): Promise<void> {
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

async function loadSettingsFromServer(): Promise<void> {
  try {
    const hostData = await apiGet<{ value: string | null }>("/api/config/ollamaHost");
    const portData = await apiGet<{ value: string | null }>("/api/config/ollamaPort");

    ollamaHostInput.value = hostData.value || localStorage.getItem("ollamaHost") || "localhost";
    ollamaPortInput.value = portData.value || localStorage.getItem("ollamaPort") || "11434";
  } catch {
    ollamaHostInput.value = localStorage.getItem("ollamaHost") || "localhost";
    ollamaPortInput.value = localStorage.getItem("ollamaPort") || "11434";
  }
  await loadVoices();
  const savedVoice = localStorage.getItem("ttsVoice") || "";
  const options = ttsVoiceSelect.options;
  for (let i = 0; i < options.length; i++) {
    if (options[i].value === savedVoice) {
      ttsVoiceSelect.selectedIndex = i;
      break;
    }
  }
  const savedSpeed = localStorage.getItem("ttsSpeed") || "0.9";
  ttsSpeedRange.value = savedSpeed;
  ttsSpeedValue.textContent = savedSpeed;
  updateUrlPreview();
  testResult.textContent = "";
}

export async function saveSettings(): Promise<void> {
  const host = ollamaHostInput.value || "localhost";
  const port = ollamaPortInput.value || "11434";
  const voice = ttsVoiceSelect.value;
  const speed = ttsSpeedRange.value;

  localStorage.setItem("ollamaHost", host);
  localStorage.setItem("ollamaPort", port);
  localStorage.setItem("ttsVoice", voice);
  localStorage.setItem("ttsSpeed", speed);
  state.ttsVoice = voice;
  state.ttsSpeed = parseFloat(speed);

  try {
    await apiPut("/api/config/ollamaHost", { value: host });
    await apiPut("/api/config/ollamaPort", { value: port });
  } catch (err) {
    console.error("Error guardando configuración en servidor:", err);
  }

  closeSettings();
  loadModels();
}

export async function deleteAllChats(): Promise<void> {
  const confirmed = confirm("¿Estás seguro de que quieres borrar todos los chats? Esta acción no se puede deshacer.");
  if (!confirmed) return;

  try {
    await apiDelete("/api/chats");
    alert("Todos los chats han sido eliminados.");
    newChat();
    refreshChatList();
  } catch (err) {
    console.error("Error eliminando chats:", err);
    alert("No se pudieron eliminar los chats.");
  }
}

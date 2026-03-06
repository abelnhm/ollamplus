import type { OllamaModel } from "../types.js";
import { apiPost } from "../api.js";
import { getOllamaUrl } from "../utils.js";
import {
  settingsModal,
  ollamaHostInput,
  ollamaPortInput,
  urlPreview,
  testResult,
} from "./elements.js";
import { loadModels } from "../services/modelService.js";

export function openSettings(): void {
  ollamaHostInput.value = localStorage.getItem("ollamaHost") || "localhost";
  ollamaPortInput.value = localStorage.getItem("ollamaPort") || "11434";
  updateUrlPreview();
  testResult.textContent = "";
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

export function saveSettings(): void {
  localStorage.setItem("ollamaHost", ollamaHostInput.value || "localhost");
  localStorage.setItem("ollamaPort", ollamaPortInput.value || "11434");
  closeSettings();
  loadModels();
}

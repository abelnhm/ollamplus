import { state } from "../state.js";
import type { OllamaModel } from "../types.js";
import { apiPost } from "../api.js";
import { getOllamaUrl, formatBytes } from "../utils.js";
import {
  modelSelector,
  modelStatus,
  modelInfoPanel,
  modelInfoFamily,
  modelInfoSize,
  modelInfoQuant,
  modelInfoFormat,
  modelInfoVramItem,
  modelInfoVram,
} from "../ui/elements.js";
import { updateTokenDisplay } from "./tokenService.js";

export async function loadModels(): Promise<void> {
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

export async function loadModelInfo(modelName: string): Promise<void> {
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

    state.modelContextLength = info.context_length || 0;
    updateTokenDisplay();

    modelInfoPanel.style.display = "";
  } catch (err) {
    console.error("Error cargando info del modelo:", err);
    modelInfoPanel.style.display = "none";
  }
}

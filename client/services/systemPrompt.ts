import {
  enableSystemPrompt,
  systemPromptInput,
  systemPromptForm,
} from "../ui/elements.js";

export function getSystemPrompt(): string | null {
  if (!enableSystemPrompt.checked) return null;
  const text = systemPromptInput.value.trim();
  return text || null;
}

export function saveSystemPromptToStorage(): void {
  localStorage.setItem(
    "systemPromptEnabled",
    enableSystemPrompt.checked ? "1" : "0",
  );
  localStorage.setItem("systemPromptText", systemPromptInput.value);
}

export function loadSystemPromptFromStorage(): void {
  const enabled = localStorage.getItem("systemPromptEnabled") === "1";
  const text = localStorage.getItem("systemPromptText") || "";
  enableSystemPrompt.checked = enabled;
  systemPromptInput.value = text;
  systemPromptForm.classList.toggle("enabled", enabled);
}

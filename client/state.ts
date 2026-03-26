import type { ImportedChat } from "./types.js";

export const state = {
  currentChatId: null as string | null,
  currentChatModel: null as string | null,
  pendingDeleteChatId: null as string | null,
  isStreaming: false,
  abortController: null as AbortController | null,
  totalTokensUsed: 0,
  modelContextLength: 0,
  inputMaxHeight: 150,
  slashHighlightIndex: -1,
  pendingModel: null as string | null,
  pendingImport: null as ImportedChat | null,
  autoSpeak: false,
  ttsVoice: "",
  ttsSpeed: 0.9,
};

export function loadSettings(): void {
  const savedAutoSpeak = localStorage.getItem("autoSpeak");
  if (savedAutoSpeak === "true") {
    state.autoSpeak = true;
  }
  const savedVoice = localStorage.getItem("ttsVoice");
  if (savedVoice) {
    state.ttsVoice = savedVoice;
  }
  const savedSpeed = localStorage.getItem("ttsSpeed");
  if (savedSpeed) {
    state.ttsSpeed = parseFloat(savedSpeed);
  }
}

loadSettings();


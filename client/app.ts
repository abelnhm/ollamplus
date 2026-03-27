// ─── Entry Point ─────────────────────────────────────────
// Arquitectura en capas: types → state → api/utils → ui → services → app

import { state } from "./state.js";

// UI
import {
  messageInput,
  sendBtn,
  modelSelector,
  toggleSidebarBtn,
  closeSidebarBtn,
  sidebarOverlay,
  newChatBtn,
  exportBtn,
  importBtn,
  clearBtn,
  settingsBtn,
  darkModeToggleSetting,
  modelParamsToggle,
  modelParamsPanel,
  enableModelParams,
  modelParamsForm,
  resetParamsBtn,
  systemPromptToggle,
  systemPromptPanel,
  enableSystemPrompt,
  systemPromptForm,
  systemPromptInput,
  clearSystemPromptBtn,
  closeDeleteChatModalBtn,
  deleteChatAcceptBtn,
  deleteChatCancelBtn,
  deleteChatModal,
  loadModelBtn,
  modelChangeAcceptBtn,
  modelChangeCancelBtn,
  closeModelChangeModal,
  stopBtn,
  chatSearchInput,
  ollamaHostInput,
  ollamaPortInput,
  closeSettingsModal,
  cancelSettingsBtn,
  saveSettingsBtn,
  testConnectionBtn,
  deleteAllChatsBtn,
  closeExportModalBtn,
  cancelExportBtn,
  closeImportModalBtn,
  cancelImportBtn,
  confirmImportBtn,
  importDropZone,
  importFileInput,
  importRemoveFile,
  promptTemplatesBtn,
  autoSpeakToggleBtn,
  autoSendVoiceBtn,
  autoVoiceAfterTtsBtn,
  ttsSpeedRange,
  ttsSpeedValue,
  templateSearchInput,
  manageTemplatesBtn,
  closeTemplateModalBtn,
  cancelTemplateBtn,
  saveTemplateBtn,
  autoResize,
} from "./ui/elements.js";
import { setMessageCallbacks } from "./ui/messages.js";
import { openSidebar, closeSidebar } from "./ui/sidebar.js";
import { initTheme, toggleTheme } from "./ui/theme.js";
import {
  openSettings,
  closeSettings,
  updateUrlPreview,
  testConnection,
  saveSettings,
  deleteAllChats,
} from "./ui/settings.js";

// Services
import {
  loadSystemPromptFromStorage,
  saveSystemPromptToStorage,
} from "./services/systemPrompt.js";
import {
  resetModelParams,
  initParamSync,
  initParamTooltips,
} from "./services/modelParams.js";
import { loadModels } from "./services/modelService.js";
import { initFileAttachment } from "./services/fileAttachment.js";
import { initSpeechToText } from "./services/sttService.js";
import {
  sendMessage,
  regenerateLastResponse,
  confirmEditMessage,
  refreshChatList,
  newChat,
  clearChat,
  closeDeleteChatModal,
  confirmDeleteChat,
  handleLoadModelClick,
  handleModelChangeAccept,
  closeModelChange,
} from "./services/chatService.js";
import {
  openExportModal,
  closeExportModal,
  exportChat,
} from "./services/exportService.js";
import {
  openImportModal,
  closeImportModal,
  resetImportModal,
  handleImportFile,
  confirmImport,
} from "./services/importService.js";
import {
  toggleTemplatesDropdown,
  closeTemplatesDropdown,
  renderTemplatesList,
  isSlashDropdownActive,
  navigateSlashDropdown,
  confirmSlashSelection,
  closeSlashDropdown,
  handleSlashInput,
  openTemplateModal,
  closeTemplateModal,
  addCustomTemplate,
} from "./services/templateService.js";

// ─── Callbacks para romper dependencias circulares ───────
setMessageCallbacks({
  onRegenerate: regenerateLastResponse,
  onEditConfirm: confirmEditMessage,
});

// ─── Event Listeners: Envío de mensajes ──────────────────
sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (e) => {
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

// ─── Resize handle para el input ─────────────────────────
(function initResizeHandle(): void {
  const handle = document.getElementById("resizeHandle") as HTMLElement | null;
  if (!handle) return;
  let startY = 0;
  let startMax = 0;

  function onPointerMove(e: PointerEvent): void {
    const delta = startY - e.clientY;
    const newMax = Math.min(
      Math.max(startMax + delta, 80),
      window.innerHeight * 0.6,
    );
    state.inputMaxHeight = newMax;
    messageInput.style.maxHeight = newMax + "px";
    messageInput.style.height = newMax + "px";
    messageInput.style.overflow = "auto";
  }

  function onPointerUp(): void {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.body.style.userSelect = "";
  }

  handle.addEventListener("pointerdown", (e: PointerEvent) => {
    e.preventDefault();
    startY = e.clientY;
    startMax = state.inputMaxHeight;
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  });
})();

// ─── Event Listeners: Sidebar ────────────────────────────
toggleSidebarBtn.addEventListener("click", () => {
  openSidebar();
  refreshChatList();
});
closeSidebarBtn.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

let chatSearchTimer: ReturnType<typeof setTimeout>;
chatSearchInput.addEventListener("input", () => {
  clearTimeout(chatSearchTimer);
  chatSearchTimer = setTimeout(() => refreshChatList(), 300);
});

// ─── Event Listeners: Cabecera ───────────────────────────
newChatBtn.addEventListener("click", newChat);
clearBtn.addEventListener("click", clearChat);

// ─── Event Listeners: Delete chat modal ──────────────────
closeDeleteChatModalBtn.addEventListener("click", closeDeleteChatModal);
deleteChatCancelBtn.addEventListener("click", closeDeleteChatModal);
deleteChatAcceptBtn.addEventListener("click", confirmDeleteChat);
deleteChatModal.addEventListener("click", (e) => {
  if (e.target === deleteChatModal) closeDeleteChatModal();
});

// ─── Event Listeners: Export ─────────────────────────────
exportBtn.addEventListener("click", openExportModal);
closeExportModalBtn.addEventListener("click", closeExportModal);
cancelExportBtn.addEventListener("click", closeExportModal);
document.querySelectorAll(".export-format-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const format = (btn as HTMLElement).dataset.format;
    if (format) exportChat(format);
  });
});

// ─── Event Listeners: Import ─────────────────────────────
importBtn.addEventListener("click", openImportModal);
closeImportModalBtn.addEventListener("click", closeImportModal);
cancelImportBtn.addEventListener("click", closeImportModal);
confirmImportBtn.addEventListener("click", confirmImport);
importRemoveFile.addEventListener("click", resetImportModal);
importDropZone.addEventListener("click", () => importFileInput.click());
importFileInput.addEventListener("change", () => {
  const file = importFileInput.files?.[0];
  if (file) handleImportFile(file);
});
importDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  importDropZone.classList.add("dragover");
});
importDropZone.addEventListener("dragleave", () => {
  importDropZone.classList.remove("dragover");
});
importDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  importDropZone.classList.remove("dragover");
  const file = e.dataTransfer?.files[0];
  if (file) handleImportFile(file);
});

// ─── Event Listeners: Tema y configuración ───────────────
darkModeToggleSetting.addEventListener("change", () => {
  const isChecked = darkModeToggleSetting.checked;
  const isCurrentlyDark = document.body.classList.contains("dark-mode");
  
  if ((isChecked && !isCurrentlyDark) || (!isChecked && isCurrentlyDark)) {
    toggleTheme();
  }
});
settingsBtn.addEventListener("click", openSettings);
closeSettingsModal.addEventListener("click", closeSettings);
cancelSettingsBtn.addEventListener("click", closeSettings);
saveSettingsBtn.addEventListener("click", saveSettings);
testConnectionBtn.addEventListener("click", testConnection);
deleteAllChatsBtn.addEventListener("click", deleteAllChats);
ollamaHostInput.addEventListener("input", updateUrlPreview);
ollamaPortInput.addEventListener("input", updateUrlPreview);

// ─── Event Listeners: Parámetros del modelo ──────────────
modelParamsToggle.addEventListener("click", () => {
  const isVisible = modelParamsPanel.style.display !== "none";
  modelParamsPanel.style.display = isVisible ? "none" : "block";
  modelParamsToggle.classList.toggle("active", !isVisible);
});
enableModelParams.addEventListener("change", () => {
  modelParamsForm.classList.toggle("enabled", enableModelParams.checked);
});
resetParamsBtn.addEventListener("click", resetModelParams);

// ─── Event Listeners: System prompt ──────────────────────
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

// ─── Event Listeners: Stop streaming ─────────────────────
stopBtn.addEventListener("click", () => {
  if (state.abortController) state.abortController.abort();
});

// ─── Event Listeners: Cambio de modelo ───────────────────
loadModelBtn.addEventListener("click", handleLoadModelClick);
modelChangeAcceptBtn.addEventListener("click", handleModelChangeAccept);
modelChangeCancelBtn.addEventListener("click", closeModelChange);
closeModelChangeModal.addEventListener("click", closeModelChange);

// ─── Event Listeners: Templates ──────────────────────────
promptTemplatesBtn.addEventListener("click", toggleTemplatesDropdown);
templateSearchInput.addEventListener("input", () => {
  renderTemplatesList(templateSearchInput.value);
});
manageTemplatesBtn.addEventListener("click", openTemplateModal);
closeTemplateModalBtn.addEventListener("click", closeTemplateModal);
cancelTemplateBtn.addEventListener("click", closeTemplateModal);
saveTemplateBtn.addEventListener("click", addCustomTemplate);

// ─── Event Listeners: Auto Speak ───────────────────────────
autoSpeakToggleBtn.addEventListener("change", () => {
  state.autoSpeak = autoSpeakToggleBtn.checked;
  localStorage.setItem("autoSpeak", state.autoSpeak.toString());
});

autoSendVoiceBtn.addEventListener("change", () => {
  state.autoSendVoice = autoSendVoiceBtn.checked;
  localStorage.setItem("autoSendVoice", state.autoSendVoice.toString());
});

autoVoiceAfterTtsBtn.addEventListener("change", () => {
  state.autoVoiceAfterTts = autoVoiceAfterTtsBtn.checked;
  localStorage.setItem("autoVoiceAfterTts", state.autoVoiceAfterTts.toString());
});

// Inicializar estado del checkbox
autoSpeakToggleBtn.checked = state.autoSpeak;
autoSendVoiceBtn.checked = state.autoSendVoice;
autoVoiceAfterTtsBtn.checked = state.autoVoiceAfterTts;

// ─── Event Listeners: TTS Speed ──────────────────────────────
ttsSpeedRange.addEventListener("input", () => {
  ttsSpeedValue.textContent = ttsSpeedRange.value;
});

// ─── Event Listeners: Cierre global ──────────────────────
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (
    document
      .getElementById("promptTemplatesDropdown")
      ?.classList.contains("active") &&
    !document.getElementById("promptTemplatesDropdown")?.contains(target) &&
    !document.getElementById("promptTemplatesBtn")?.contains(target)
  ) {
    closeTemplatesDropdown();
  }
  if (isSlashDropdownActive()) {
    const slashDd = document.getElementById("slashCommandDropdown");
    if (slashDd && !slashDd.contains(target) && target !== messageInput) {
      closeSlashDropdown();
    }
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSettings();
    closeSidebar();
    closeModelChange();
    closeExportModal();
    closeImportModal();
    closeTemplatesDropdown();
    closeSlashDropdown();
    closeTemplateModal();
  }
});

// ─── Inicialización ──────────────────────────────────────
initTheme();
initFileAttachment();
initSpeechToText();
loadModels();
refreshChatList();
initParamSync();
initParamTooltips();
loadSystemPromptFromStorage();

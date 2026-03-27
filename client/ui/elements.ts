import { state } from "../state.js";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

// ─── Chat area ───────────────────────────────────────────
export const chatMessages = $<HTMLDivElement>("chatMessages");
export const messageInput = $<HTMLTextAreaElement>("messageInput");
export const sendBtn = $<HTMLButtonElement>("sendBtn");
export const autoSpeakToggleBtn = $<HTMLInputElement>("autoSpeakToggleBtn");
export const sendIcon = $<HTMLElement>("sendIcon");
export const sendText = $<HTMLSpanElement>("sendText");
export const modelSelector = $<HTMLSelectElement>("modelSelector");
export const modelStatus = $<HTMLSpanElement>("modelStatus");
export const sidebar = $<HTMLDivElement>("sidebar");
export const sidebarOverlay = $<HTMLDivElement>("sidebarOverlay");
export const chatsList = $<HTMLDivElement>("chatsList");
export const fileInput = $<HTMLInputElement>("fileInput");
export const attachFileBtn = $<HTMLButtonElement>("attachFileBtn");
export const attachedFilePreview = $<HTMLDivElement>("attachedFilePreview");
export const attachedFileName = $<HTMLSpanElement>("attachedFileName");
export const removeAttachedFile = $<HTMLButtonElement>("removeAttachedFile");

export const recordAudioBtn = $<HTMLButtonElement>("recordAudioBtn");
export const recordingIndicator = $<HTMLDivElement>("recordingIndicator");
export const recordingTime = $<HTMLSpanElement>("recordingTime");
export const autoSendVoiceBtn = $<HTMLInputElement>("autoSendVoiceBtn");

// ─── Header buttons ──────────────────────────────────────
export const toggleSidebarBtn = $<HTMLButtonElement>("toggleSidebarBtn");
export const closeSidebarBtn = $<HTMLButtonElement>("closeSidebarBtn");
export const newChatBtn = $<HTMLButtonElement>("newChatBtn");
export const exportBtn = $<HTMLButtonElement>("exportBtn");
export const importBtn = $<HTMLButtonElement>("importBtn");
export const clearBtn = $<HTMLButtonElement>("clearBtn");
export const settingsBtn = $<HTMLButtonElement>("settingsBtn");
export const darkModeToggleSetting = $<HTMLInputElement>("darkModeToggleSetting");

// ─── Settings modal ─────────────────────────────────────
export const settingsModal = $<HTMLDivElement>("settingsModal");
export const ollamaHostInput = $<HTMLInputElement>("ollamaHost");
export const ollamaPortInput = $<HTMLInputElement>("ollamaPort");
export const urlPreview = $<HTMLElement>("urlPreview");
export const testConnectionBtn = $<HTMLButtonElement>("testConnection");
export const testResult = $<HTMLElement>("testResult");
export const saveSettingsBtn = $<HTMLButtonElement>("saveSettings");
export const cancelSettingsBtn = $<HTMLButtonElement>("cancelSettings");
export const closeSettingsModal = $<HTMLButtonElement>("closeSettingsModal");
export const deleteAllChatsBtn = $<HTMLButtonElement>("deleteAllChats");
export const ttsVoiceSelect = $<HTMLSelectElement>("ttsVoiceSelect");
export const ttsSpeedRange = $<HTMLInputElement>("ttsSpeedRange");
export const ttsSpeedValue = $<HTMLSpanElement>("ttsSpeedValue");

// ─── Model change modal ─────────────────────────────────
export const loadModelBtn = $<HTMLButtonElement>("loadModelBtn");
export const modelChangeModal = $<HTMLDivElement>("modelChangeModal");
export const modelChangeModalText = $<HTMLParagraphElement>(
  "modelChangeModalText",
);
export const modelChangeAcceptBtn = $<HTMLButtonElement>(
  "modelChangeAcceptBtn",
);
export const modelChangeCancelBtn = $<HTMLButtonElement>(
  "modelChangeCancelBtn",
);
export const closeModelChangeModal = $<HTMLButtonElement>(
  "closeModelChangeModal",
);

// ─── Stop button ─────────────────────────────────────────
export const stopBtn = $<HTMLButtonElement>("stopBtn");

// ─── Model params panel ─────────────────────────────────
export const modelParamsToggle = $<HTMLButtonElement>("modelParamsToggle");
export const modelParamsPanel = $<HTMLDivElement>("modelParamsPanel");
export const enableModelParams = $<HTMLInputElement>("enableModelParams");
export const modelParamsForm = $<HTMLDivElement>("modelParamsForm");
export const resetParamsBtn = $<HTMLButtonElement>("resetParamsBtn");

// ─── System prompt panel ─────────────────────────────────
export const systemPromptToggle = $<HTMLButtonElement>("systemPromptToggle");
export const systemPromptPanel = $<HTMLDivElement>("systemPromptPanel");
export const enableSystemPrompt = $<HTMLInputElement>("enableSystemPrompt");
export const systemPromptForm = $<HTMLDivElement>("systemPromptForm");
export const systemPromptInput = $<HTMLTextAreaElement>("systemPromptInput");
export const clearSystemPromptBtn = $<HTMLButtonElement>("clearSystemPrompt");

// ─── Delete chat modal ──────────────────────────────────
export const deleteChatModal = $<HTMLDivElement>("deleteChatModal");
export const closeDeleteChatModalBtn = $<HTMLButtonElement>(
  "closeDeleteChatModal",
);
export const deleteChatAcceptBtn = $<HTMLButtonElement>("deleteChatAcceptBtn");
export const deleteChatCancelBtn = $<HTMLButtonElement>("deleteChatCancelBtn");

// ─── Chat search ─────────────────────────────────────────
export const chatSearchInput = $<HTMLInputElement>("chatSearchInput");

// ─── Model info panel ────────────────────────────────────
export const modelInfoPanel = $<HTMLDivElement>("modelInfoPanel");
export const modelInfoFamily = $<HTMLSpanElement>("modelInfoFamily");
export const modelInfoSize = $<HTMLSpanElement>("modelInfoSize");
export const modelInfoQuant = $<HTMLSpanElement>("modelInfoQuant");
export const modelInfoFormat = $<HTMLSpanElement>("modelInfoFormat");
export const modelInfoVramItem = $<HTMLDivElement>("modelInfoVramItem");
export const modelInfoVram = $<HTMLSpanElement>("modelInfoVram");

// ─── Token usage ─────────────────────────────────────────
export const tokenUsageContainer = $<HTMLDivElement>("tokenUsageContainer");
export const tokenUsageSummary = $<HTMLSpanElement>("tokenUsageSummary");
export const tokenUsageBar = $<HTMLDivElement>("tokenUsageBar");
export const tokenPromptCount = $<HTMLElement>("tokenPromptCount");
export const tokenResponseCount = $<HTMLElement>("tokenResponseCount");
export const tokenContextLimit = $<HTMLElement>("tokenContextLimit");

// ─── Prompt templates ────────────────────────────────────
export const promptTemplatesBtn = $<HTMLButtonElement>("promptTemplatesBtn");
export const promptTemplatesDropdown = $<HTMLDivElement>(
  "promptTemplatesDropdown",
);
export const promptTemplatesList = $<HTMLDivElement>("promptTemplatesList");
export const templateSearchInput = $<HTMLInputElement>("templateSearchInput");
export const manageTemplatesBtn = $<HTMLButtonElement>("manageTemplatesBtn");
export const templateModal = $<HTMLDivElement>("templateModal");
export const closeTemplateModalBtn = $<HTMLButtonElement>("closeTemplateModal");
export const cancelTemplateBtn = $<HTMLButtonElement>("cancelTemplateBtn");
export const saveTemplateBtn = $<HTMLButtonElement>("saveTemplateBtn");
export const templateNameInput = $<HTMLInputElement>("templateNameInput");
export const templateTextInput = $<HTMLInputElement>("templateTextInput");
export const templateManageList = $<HTMLDivElement>("templateManageList");

// ─── Export modal ────────────────────────────────────────
export const exportModal = $<HTMLDivElement>("exportModal");
export const closeExportModalBtn = $<HTMLButtonElement>("closeExportModal");
export const cancelExportBtn = $<HTMLButtonElement>("cancelExportBtn");

// ─── Import modal ────────────────────────────────────────
export const importModal = $<HTMLDivElement>("importModal");
export const closeImportModalBtn = $<HTMLButtonElement>("closeImportModal");
export const cancelImportBtn = $<HTMLButtonElement>("cancelImportBtn");
export const confirmImportBtn = $<HTMLButtonElement>("confirmImportBtn");
export const importDropZone = $<HTMLDivElement>("importDropZone");
export const importFileInput = $<HTMLInputElement>("importFileInput");
export const importPreview = $<HTMLDivElement>("importPreview");
export const importFileName = $<HTMLElement>("importFileName");
export const importPreviewTitle = $<HTMLElement>("importPreviewTitle");
export const importPreviewModel = $<HTMLElement>("importPreviewModel");
export const importPreviewMessages = $<HTMLElement>("importPreviewMessages");
export const importRemoveFile = $<HTMLButtonElement>("importRemoveFile");
export const importError = $<HTMLDivElement>("importError");

export const alertModal = $<HTMLDivElement>("alertModal");
export const alertModalText = $<HTMLParagraphElement>("alertModalText");
export const alertModalOk = $<HTMLButtonElement>("alertModalOk");
export const closeAlertModalBtn = $<HTMLButtonElement>("closeAlertModal");

// ─── DOM helpers ─────────────────────────────────────────
export function scrollToBottom(): void {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

export function autoResize(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height =
    Math.min(textarea.scrollHeight, state.inputMaxHeight) + "px";
}

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
};


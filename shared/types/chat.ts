import type { MessageJSON } from "./message.js";

export interface ChatJSON {
  id: string;
  model: string;
  title: string;
  instructions?: string;
  parameters?: ChatParameters;
  modelInfo?: ModelInfo;
  messages: MessageJSON[];
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  pinned: boolean;
}

export interface ChatParameters {
  temperature?: number;
  topP?: number;
  topK?: number;
  numCtx?: number;
  numKeep?: number;
  seed?: number;
  repeatPenalty?: number;
  repeatLastN?: number;
  numGPU?: number;
  numThread?: number;
  stop?: string[];
}

export interface ModelInfo {
  size?: string;
  family?: string;
  format?: string;
  quantization?: string;
  parameterSize?: string;
  quantizationLevel?: string;
}

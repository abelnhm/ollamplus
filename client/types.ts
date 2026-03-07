export interface ChatJSON {
  id: string;
  model: string;
  title: string;
  messages: MessageJSON[];
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  pinned: boolean;
}

export interface MessageJSON {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  metrics?: MessageMetrics;
}

export interface MessageMetrics {
  tokenCount?: number;
  durationMs?: number;
  tokensPerSecond?: number;
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export interface ModelOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_ctx?: number;
  repeat_penalty?: number;
  seed?: number;
  num_predict?: number;
  stop?: string[];
  mirostat?: number;
  mirostat_tau?: number;
  mirostat_eta?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  text: string;
  builtin?: boolean;
}

export interface ImportedChat {
  model: string;
  title: string;
  messages: { role: string; content: string }[];
}


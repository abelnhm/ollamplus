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

export interface MessageRole {
  role: "user" | "assistant" | "system";
  content: string;
}

import { randomUUID } from "crypto";

/**
 * Message model.
 * Represents a single message inside a chat.
 */

export interface MessageData {
  id?: string;
  role: string;
  content: string;
  timestamp?: Date;
  metrics?: MessageMetrics;
}

export interface MessageMetrics {
  tokenCount?: number;
  durationMs?: number;
  tokensPerSecond?: number;
}

export class Message {
  id: string;
  role: string;
  content: string;
  timestamp: Date;
  metrics?: MessageMetrics;

  constructor({ id, role, content, timestamp, metrics }: MessageData) {
    this.id = id || randomUUID();
    this.role = role;
    this.content = content;
    this.timestamp = timestamp || new Date();
    this.metrics = metrics;
  }

  toJSON() {
    const metrics =
      this.metrics &&
      (typeof this.metrics.tokenCount === "number" ||
        typeof this.metrics.durationMs === "number" ||
        typeof this.metrics.tokensPerSecond === "number")
        ? {
            tokenCount: this.metrics.tokenCount,
            durationMs: this.metrics.durationMs,
            tokensPerSecond: this.metrics.tokensPerSecond,
          }
        : undefined;

    return {
      id: this.id,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp.toISOString(),
      metrics,
    };
  }
}

import { randomUUID } from "crypto";
import { Message } from "./Message.js";

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

export interface ChatData {
  id?: string;
  model: string;
  title?: string;
  instructions?: string;
  parameters?: ChatParameters;
  modelInfo?: {
    size?: string;
    family?: string;
    format?: string;
    quantization?: string;
  };
  messages?: Message[];
  createdAt?: Date;
  lastMessageAt?: Date;
  pinned?: boolean;
}

export class Chat {
  id: string;
  model: string;
  title: string;
  instructions: string;
  parameters: ChatParameters;
  modelInfo: {
    size?: string;
    family?: string;
    format?: string;
    quantization?: string;
  };
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
  pinned: boolean;

  constructor({
    id,
    model,
    title = "Nuevo chat",
    instructions = "",
    parameters = {},
    modelInfo = {},
    messages = [],
    createdAt,
    lastMessageAt,
    pinned,
  }: ChatData) {
    this.id = id || randomUUID();
    this.model = model;
    this.title = title;
    this.instructions = instructions;
    this.parameters = parameters;
    this.modelInfo = modelInfo;
    this.messages = messages;
    this.createdAt = createdAt || new Date();
    this.lastMessageAt = lastMessageAt || new Date();
    this.pinned = pinned || false;
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    this.lastMessageAt = new Date();
  }

  getHistory(): { role: string; content: string }[] {
    return this.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  toJSON() {
    return {
      id: this.id,
      model: this.model,
      title: this.title,
      instructions: this.instructions,
      parameters: this.parameters,
      modelInfo: this.modelInfo,
      messages: this.messages.map((msg) => msg.toJSON()),
      createdAt: this.createdAt.toISOString(),
      lastMessageAt: this.lastMessageAt.toISOString(),
      messageCount: this.messages.length,
      pinned: this.pinned,
    };
  }
}

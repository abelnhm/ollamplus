import { randomUUID } from "crypto";

/**
 * Modelo: Message
 * Representa un mensaje individual dentro de una conversación.
 *
 * Los roles posibles son:
 *   - "user"      → Mensaje escrito por el usuario
 *   - "assistant"  → Respuesta generada por la IA
 *   - "system"     → Instrucción del sistema (contexto)
 */

export interface MessageData {
  id?: string;
  role: string;
  content: string;
  timestamp?: Date;
}

export class Message {
  id: string;
  role: string;
  content: string;
  timestamp: Date;

  constructor({ id, role, content, timestamp }: MessageData) {
    this.id = id || randomUUID();
    this.role = role;
    this.content = content;
    this.timestamp = timestamp || new Date();
  }

  toJSON() {
    return {
      id: this.id,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

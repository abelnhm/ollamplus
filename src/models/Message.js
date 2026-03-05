import { randomUUID } from "crypto";

/**
 * Modelo: Message
 * Representa un mensaje individual dentro de una conversación.
 *
 * CAPA: Modelos (datos)
 * RESPONSABILIDAD: Definir la estructura de un mensaje.
 *
 * Los roles posibles son:
 *   - "user"      → Mensaje escrito por el usuario
 *   - "assistant"  → Respuesta generada por la IA
 *   - "system"     → Instrucción del sistema (contexto)
 */
export class Message {
  constructor({ id, role, content, timestamp }) {
    this.id = id || randomUUID();
    this.role = role;
    this.content = content;
    this.timestamp = timestamp || new Date();
  }

  /**
   * Convierte el mensaje a un objeto plano (JSON) para respuestas HTTP.
   */
  toJSON() {
    return {
      id: this.id,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

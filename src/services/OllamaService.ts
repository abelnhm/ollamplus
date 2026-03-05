import { Ollama } from "ollama";

/**
 * Servicio: OllamaService
 * Se comunica con la API de Ollama para obtener modelos y enviar mensajes.
 *
 * Ollama es un servidor local que ejecuta modelos de IA.
 * Este servicio usa la librería 'ollama' de npm para interactuar con él.
 */

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export class OllamaService {
  private createClient(url: string): Ollama {
    return new Ollama({ host: url });
  }

  async listModels(url: string): Promise<OllamaModel[]> {
    try {
      const client = this.createClient(url);
      const response = await client.list();

      if (!response || !response.models) {
        return [];
      }

      return response.models.map((model) => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at as unknown as string,
      }));
    } catch (error) {
      throw new Error(
        `Error al obtener modelos de Ollama: ${(error as Error).message}`,
      );
    }
  }

  async sendMessage(
    model: string,
    messages: { role: string; content: string }[],
    url: string,
    onChunk?: (chunk: string) => void,
    options?: Record<string, unknown>,
    systemPrompt?: string,
  ): Promise<string> {
    try {
      const client = this.createClient(url);

      // Prepend system prompt if provided
      const finalMessages = systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...messages]
        : messages;

      const chatParams: Record<string, unknown> = {
        model,
        messages: finalMessages,
        stream: true,
      };
      if (options && Object.keys(options).length > 0) {
        chatParams.options = options;
      }
      const response = await client.chat(chatParams as any);

      let fullResponse = "";

      for await (const part of response) {
        const content = part.message.content;
        fullResponse += content;
        if (onChunk) {
          onChunk(content);
        }
      }

      return fullResponse;
    } catch (error) {
      throw new Error(
        `Error al enviar mensaje a Ollama: ${(error as Error).message}`,
      );
    }
  }
}

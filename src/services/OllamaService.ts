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

  async showModel(
    url: string,
    modelName: string,
  ): Promise<{
    family: string;
    parameter_size: string;
    quantization_level: string;
    format: string;
    families: string[];
    size_vram: number;
    context_length: number;
  }> {
    try {
      const client = this.createClient(url);
      const response = await client.show({ model: modelName });
      const details = response.details || ({} as any);
      const modelInfo = response.model_info as any;

      // Try to extract VRAM from model_info or estimate from model size
      let sizeVram = 0;
      let contextLength = 0;
      if (modelInfo) {
        // Some ollama versions expose vram in model_info
        for (const key of Object.keys(modelInfo)) {
          if (
            key.toLowerCase().includes("vram") ||
            key.toLowerCase().includes("memory")
          ) {
            sizeVram = Number(modelInfo[key]) || 0;
          }
          if (key.toLowerCase().includes("context_length")) {
            contextLength = Number(modelInfo[key]) || 0;
          }
        }
      }

      return {
        family: details.family || "Desconocida",
        parameter_size: details.parameter_size || "Desconocido",
        quantization_level: details.quantization_level || "Desconocida",
        format: details.format || "Desconocido",
        families: details.families || [],
        size_vram: sizeVram,
        context_length: contextLength,
      };
    } catch (error) {
      throw new Error(
        `Error al obtener info del modelo: ${(error as Error).message}`,
      );
    }
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

  async countTokens(
    model: string,
    messages: { role: string; content: string }[],
    url: string,
    systemPrompt?: string,
  ): Promise<{ promptTokens: number }> {
    try {
      const client = this.createClient(url);

      const finalMessages = systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...messages]
        : messages;

      const response = await client.chat({
        model,
        messages: finalMessages,
        stream: false,
        options: { num_predict: 0 },
      } as any);

      return {
        promptTokens: (response as any).prompt_eval_count || 0,
      };
    } catch (error) {
      throw new Error(`Error al contar tokens: ${(error as Error).message}`);
    }
  }

  async sendMessage(
    model: string,
    messages: { role: string; content: string }[],
    url: string,
    onChunk?: (chunk: string) => void,
    options?: Record<string, unknown>,
    systemPrompt?: string,
  ): Promise<{
    response: string;
    promptTokens: number;
    responseTokens: number;
  }> {
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
      let promptTokens = 0;
      let responseTokens = 0;

      for await (const part of response) {
        const content = part.message.content;
        fullResponse += content;
        if (onChunk) {
          onChunk(content);
        }
        // Capture token counts from the final chunk
        if ((part as any).done) {
          promptTokens = (part as any).prompt_eval_count || 0;
          responseTokens = (part as any).eval_count || 0;
        }
      }

      return { response: fullResponse, promptTokens, responseTokens };
    } catch (error) {
      throw new Error(
        `Error al enviar mensaje a Ollama: ${(error as Error).message}`,
      );
    }
  }
}

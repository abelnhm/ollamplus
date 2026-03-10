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

      let sizeVram = 0;
      let contextLength = 0;
      if (modelInfo) {
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
    totalDurationMs: number;
    tokensPerSecond: number;
  }> {
    const startedAt = Date.now();
    let fullResponse = "";
    let promptTokens = 0;
    let responseTokens = 0;
    let evalDurationNs = 0;

    try {
      const finalMessages = systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...messages]
        : messages;

      const chatParams: Record<string, unknown> = {
        model,
        messages: finalMessages,
        stream: false,
      };
      if (options && Object.keys(options).length > 0) {
        chatParams.options = options;
      }

      const response = await fetch(`${url}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatParams),
      });

      if (!response.body) {
        throw new Error("No response body from Ollama");
      }

      const data = await response.json();
      
      fullResponse = data.message?.content || "";
      promptTokens = data.prompt_eval_count || 0;
      responseTokens = data.eval_count || 0;
      evalDurationNs = Number(data.eval_duration) || 0;

      if (onChunk && fullResponse) {
        onChunk(fullResponse);
      }

      const totalDurationMs = Math.max(Date.now() - startedAt, 0);
      const evalDurationMs =
        evalDurationNs > 0 ? Math.max(evalDurationNs / 1_000_000, 0) : 0;
      const durationForSpeedMs = evalDurationMs > 0 ? evalDurationMs : totalDurationMs;
      const tokensPerSecond =
        durationForSpeedMs > 0
          ? responseTokens / (durationForSpeedMs / 1000)
          : 0;

      return {
        response: fullResponse,
        promptTokens,
        responseTokens,
        totalDurationMs,
        tokensPerSecond,
      };
    } catch (error) {
      console.error("[OllamaService] Error:", error);
      throw new Error(
        `Error al enviar mensaje a Ollama: ${(error as Error).message}`,
      );
    }
  }
}

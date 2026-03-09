import { z } from "zod";

export const createChatSchema = z.object({
  model: z.string().min(1, "El modelo es requerido"),
  title: z.string().min(1, "El título es requerido").optional(),
  instructions: z.string().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().optional(),
  ollamaUrl: z.string().url().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  systemPrompt: z.string().optional(),
});

export const updateChatSchema = z.object({
  title: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  instructions: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  modelInfo: z.record(z.string(), z.unknown()).optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, "El contenido es requerido"),
});

export const importChatSchema = z.object({
  model: z.string().min(1),
  title: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateChatInput = z.infer<typeof updateChatSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type ImportChatInput = z.infer<typeof importChatSchema>;

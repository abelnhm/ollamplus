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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

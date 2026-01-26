import {
  OllamaChat,
  startInteractiveChat,
} from "./feature/Ollama/ollama-local.js";

// Opción A: Chat interactivo en consola
await startInteractiveChat();

// Opción B: Uso programático
// const chat = new OllamaChat();
// await chat.sendMessage("¿Qué es JavaScript?");
// await chat.sendMessage("Dame un ejemplo de código");

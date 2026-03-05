import readline from "readline";
import { InMemoryChatRepository } from "../../infrastructure/repositories/InMemoryChatRepository.js";
import { OllamaAIProvider } from "../../infrastructure/ai-providers/OllamaAIProvider.js";
import { CreateChatUseCase } from "../../application/use-cases/CreateChatUseCase.js";
import { SendMessageUseCase } from "../../application/use-cases/SendMessageUseCase.js";

/**
 * Presentation (Primary Adapter): CLIChatAdapter
 * Adaptador de consola para interacción interactiva con el chat.
 * Implementa el puerto de entrada mediante readline y los use cases de aplicación.
 */
export class CLIChatAdapter {
  #createChatUseCase;
  #sendMessageUseCase;
  #chatId = null;
  #model;

  constructor(createChatUseCase, sendMessageUseCase, model) {
    this.#createChatUseCase = createChatUseCase;
    this.#sendMessageUseCase = sendMessageUseCase;
    this.#model = model || process.env.OLLAMA_MODEL || "llama2";
  }

  async start() {
    const chat = await this.#createChatUseCase.execute({
      model: this.#model,
      title: `Chat CLI con ${this.#model}`,
    });
    this.#chatId = chat.id;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(
      `Chat iniciado con modelo ${this.#model}. Escribe 'salir' para terminar.\n`,
    );

    const askQuestion = () => {
      rl.question("Tú: ", async (input) => {
        const trimmed = input.trim();
        if (trimmed.toLowerCase() === "salir") {
          console.log("¡Hasta luego!");
          rl.close();
          return;
        }
        if (!trimmed) {
          askQuestion();
          return;
        }
        process.stdout.write("Asistente: ");
        try {
          await this.#sendMessageUseCase.execute({
            chatId: this.#chatId,
            content: trimmed,
            onChunk: (chunk) => process.stdout.write(chunk),
          });
          console.log("\n");
        } catch (error) {
          console.error(`\nError: ${error.message}\n`);
        }
        askQuestion();
      });
    };

    askQuestion();
  }
}

/**
 * Función de arranque del modo CLI interactivo.
 * Crea sus propias dependencias de infraestructura y arranca el adaptador.
 */
export async function startInteractiveCLIChat(model = null) {
  const chatRepository = new InMemoryChatRepository();
  const aiProvider = new OllamaAIProvider();
  const createChatUseCase = new CreateChatUseCase(chatRepository);
  const sendMessageUseCase = new SendMessageUseCase(chatRepository, aiProvider);

  const adapter = new CLIChatAdapter(
    createChatUseCase,
    sendMessageUseCase,
    model,
  );
  await adapter.start();
}

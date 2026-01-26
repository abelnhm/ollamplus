import ollama from "ollama";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

export class OllamaChat {
  constructor() {
    this.conversationHistory = [];
  }

  async sendMessage(userMessage) {
    // Agregar mensaje del usuario al historial
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    const response = await ollama.chat({
      model: process.env.OLLAMA_MODEL,
      messages: this.conversationHistory,
      stream: true,
    });

    let fullResponse = "";

    // Mostrar respuesta en tiempo real
    for await (const part of response) {
      const content = part.message.content;
      process.stdout.write(content);
      fullResponse += content;
    }

    console.log("\n"); // Nueva línea al terminar

    // Agregar respuesta del asistente al historial
    this.conversationHistory.push({
      role: "assistant",
      content: fullResponse,
    });

    return fullResponse;
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

// Modo interactivo en consola
export async function startInteractiveChat() {
  const chat = new OllamaChat();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Chat iniciado. Escribe 'salir' para terminar.\n");

  const askQuestion = () => {
    rl.question("Tú: ", async (input) => {
      if (input.toLowerCase() === "salir") {
        console.log("¡Hasta luego!");
        rl.close();
        return;
      }

      process.stdout.write("Asistente: ");
      await chat.sendMessage(input);

      askQuestion(); // Continuar la conversación
    });
  };

  askQuestion();
}

import { InMemoryChatRepository } from "../repositories/InMemoryChatRepository.js";
import { OllamaAIProvider } from "../ai-providers/OllamaAIProvider.js";
import { CreateChatUseCase } from "../../application/use-cases/CreateChatUseCase.js";
import { SendMessageUseCase } from "../../application/use-cases/SendMessageUseCase.js";
import { GetAvailableModelsUseCase } from "../../application/use-cases/GetAvailableModelsUseCase.js";
import { GetAllChatsUseCase } from "../../application/use-cases/GetAllChatsUseCase.js";
import { GetChatByIdUseCase } from "../../application/use-cases/GetChatByIdUseCase.js";
import { DeleteChatUseCase } from "../../application/use-cases/DeleteChatUseCase.js";
import { ChatController } from "../../presentation/controllers/ChatController.js";
import { ModelController } from "../../presentation/controllers/ModelController.js";
import { createChatRoutes } from "../../presentation/routes/chatRoutes.js";
import { createModelRoutes } from "../../presentation/routes/modelRoutes.js";
import { ExpressServer } from "./ExpressServer.js";

/**
 * Infrastructure: DependencyContainer
 * Contenedor de inyección de dependencias
 * Principio: Dependency Inversion - Gestiona las dependencias de forma centralizada
 * Principio: Single Responsibility - Solo crea e inyecta dependencias
 */
export class DependencyContainer {
  #chatRepository;
  #aiProvider;
  #createChatUseCase;
  #sendMessageUseCase;
  #getAvailableModelsUseCase;
  #getAllChatsUseCase;
  #getChatByIdUseCase;
  #deleteChatUseCase;
  #chatController;
  #modelController;
  #server;

  constructor(port = 3000) {
    this.#initializeInfrastructure();
    this.#initializeUseCases();
    this.#initializeControllers();
    this.#initializeServer(port);
    this.#configureRoutes();
  }

  /**
   * Inicializa la capa de infraestructura
   */
  #initializeInfrastructure() {
    this.#chatRepository = new InMemoryChatRepository();
    this.#aiProvider = new OllamaAIProvider();
  }

  /**
   * Inicializa los casos de uso
   */
  #initializeUseCases() {
    this.#createChatUseCase = new CreateChatUseCase(this.#chatRepository);
    this.#sendMessageUseCase = new SendMessageUseCase(
      this.#chatRepository,
      this.#aiProvider,
    );
    this.#getAvailableModelsUseCase = new GetAvailableModelsUseCase(
      this.#aiProvider,
    );
    this.#getAllChatsUseCase = new GetAllChatsUseCase(this.#chatRepository);
    this.#getChatByIdUseCase = new GetChatByIdUseCase(this.#chatRepository);
    this.#deleteChatUseCase = new DeleteChatUseCase(this.#chatRepository);
  }

  /**
   * Inicializa los controladores
   */
  #initializeControllers() {
    this.#chatController = new ChatController(
      this.#createChatUseCase,
      this.#sendMessageUseCase,
      this.#getAllChatsUseCase,
      this.#getChatByIdUseCase,
      this.#deleteChatUseCase,
    );
    this.#modelController = new ModelController(
      this.#getAvailableModelsUseCase,
    );
  }

  /**
   * Inicializa el servidor HTTP
   */
  #initializeServer(port) {
    this.#server = new ExpressServer(port);
  }

  /**
   * Configura las rutas
   */
  #configureRoutes() {
    const chatRoutes = createChatRoutes(this.#chatController);
    const modelRoutes = createModelRoutes(this.#modelController);

    this.#server.registerRoutes("/api", chatRoutes);
    this.#server.registerRoutes("/api", modelRoutes);
    this.#server.registerErrorHandler();
  }

  /**
   * Inicia la aplicación
   */
  start() {
    this.#server.start();
  }

  /**
   * Obtiene el servidor (útil para testing)
   */
  getServer() {
    return this.#server;
  }
}

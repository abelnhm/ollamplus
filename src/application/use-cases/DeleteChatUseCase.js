import { ChatId } from "../../domain/value-objects/ChatId.js";

export class DeleteChatUseCase {
  #chatRepository;

  constructor(chatRepository) {
    this.#chatRepository = chatRepository;
  }

  async execute({ chatId }) {
    if (!chatId) throw new Error("chatId es requerido");

    const id = new ChatId(chatId);
    const exists = await this.#chatRepository.exists(id);
    if (!exists) throw new Error(`Chat con ID ${chatId} no encontrado`);

    await this.#chatRepository.delete(id);
  }
}

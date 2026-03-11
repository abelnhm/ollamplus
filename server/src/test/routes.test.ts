import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router } from 'express';
import { createChatRoutes } from '../routes/chatRoutes.js';
import { createModelRoutes } from '../routes/modelRoutes.js';

const mockChatService = {
  create: vi.fn((model, title) => ({ id: 'chat-1', model, title, toJSON: () => ({ id: 'chat-1', model, title }) })),
  getById: vi.fn(),
  getAll: vi.fn(),
  delete: vi.fn(),
  rename: vi.fn(),
  changeModel: vi.fn(),
  togglePin: vi.fn(),
  addMessage: vi.fn(),
  search: vi.fn(),
  removeLastMessage: vi.fn(),
  truncateAtMessage: vi.fn(),
  getAppConfig: vi.fn(),
  setAppConfig: vi.fn(),
  deleteAllChats: vi.fn(),
};

const mockOllamaService = {
  listModels: vi.fn().mockResolvedValue([]),
  showModel: vi.fn().mockResolvedValue({ family: 'llama' }),
  sendMessage: vi.fn(),
  countTokens: vi.fn().mockResolvedValue({ promptTokens: 10 }),
};

vi.mock('../services/ChatService.js', () => ({
  ChatService: vi.fn().mockImplementation(() => mockChatService)
}));

vi.mock('../services/OllamaService.js', () => ({
  OllamaService: vi.fn().mockImplementation(() => mockOllamaService)
}));

describe('Chat Routes', () => {
  let router: Router;

  beforeEach(() => {
    vi.clearAllMocks();
    router = createChatRoutes(mockChatService as any, mockOllamaService as any);
  });

  it('should create router with routes defined', () => {
    expect(router).toBeDefined();
    expect(router.stack).toBeDefined();
    expect(router.stack.length).toBeGreaterThan(0);
  });

  it('should have POST /new-chat route', () => {
    const newChatRoute = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/new-chat' && layer.route.methods.post
    );
    expect(newChatRoute).toBeDefined();
  });

  it('should have GET /chats route', () => {
    const chatsRoute = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats' && layer.route.methods.get
    );
    expect(chatsRoute).toBeDefined();
  });

  it('should have GET /chats/:chatId route', () => {
    const chatIdRoute = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/:chatId' && layer.route.methods.get
    );
    expect(chatIdRoute).toBeDefined();
  });

  it('should have DELETE /chats/:chatId route', () => {
    const deleteRoute = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/:chatId' && layer.route.methods.delete
    );
    expect(deleteRoute).toBeDefined();
  });

  it('should have PATCH /chats/:chatId route', () => {
    const patchRoute = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/:chatId' && layer.route.methods.patch
    );
    expect(patchRoute).toBeDefined();
  });

  it('should have POST /chat/:chatId/message route', () => {
    const msgRoute = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chat/:chatId/message' && layer.route.methods.post
    );
    expect(msgRoute).toBeDefined();
  });

  it('should have GET /chats/search route', () => {
    const searchRoute = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/search' && layer.route.methods.get
    );
    expect(searchRoute).toBeDefined();
  });

  it('should have POST /import-chat route', () => {
    const importRoute = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/import-chat' && layer.route.methods.post
    );
    expect(importRoute).toBeDefined();
  });

  it('should have DELETE /chats route', () => {
    const deleteAllRoute = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats' && layer.route.methods.delete
    );
    expect(deleteAllRoute).toBeDefined();
  });
});

describe('Model Routes', () => {
  let router: Router;

  beforeEach(() => {
    vi.clearAllMocks();
    router = createModelRoutes(mockOllamaService as any);
  });

  it('should create router with routes defined', () => {
    expect(router).toBeDefined();
    expect(router.stack).toBeDefined();
    expect(router.stack.length).toBeGreaterThan(0);
  });

  it('should have POST /models route', () => {
    const modelsRoute = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/models' && layer.route.methods.post
    );
    expect(modelsRoute).toBeDefined();
  });

  it('should have POST /model-info route', () => {
    const modelInfoRoute = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/model-info' && layer.route.methods.post
    );
    expect(modelInfoRoute).toBeDefined();
  });
});

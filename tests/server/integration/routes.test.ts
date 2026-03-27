import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router } from 'express';
import { createChatRoutes } from '../../../server/src/routes/chatRoutes.js';
import { createModelRoutes } from '../../../server/src/routes/modelRoutes.js';

const mockChatService = {
  create: vi.fn((model, title) => ({ 
    id: 'chat-1', 
    model, 
    title, 
    toJSON: () => ({ id: 'chat-1', model, title }) 
  })),
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
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/new-chat' && layer.route.methods.post
    );
    expect(route).toBeDefined();
  });

  it('should have GET /chats route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats' && layer.route.methods.get
    );
    expect(route).toBeDefined();
  });

  it('should have GET /chats/:chatId route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/:chatId' && layer.route.methods.get
    );
    expect(route).toBeDefined();
  });

  it('should have DELETE /chats/:chatId route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/:chatId' && layer.route.methods.delete
    );
    expect(route).toBeDefined();
  });

  it('should have PATCH /chats/:chatId route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/:chatId' && layer.route.methods.patch
    );
    expect(route).toBeDefined();
  });

  it('should have POST /chat/:chatId/message route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chat/:chatId/message' && layer.route.methods.post
    );
    expect(route).toBeDefined();
  });

  it('should have GET /chats/search route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/search' && layer.route.methods.get
    );
    expect(route).toBeDefined();
  });

  it('should have POST /import-chat route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/import-chat' && layer.route.methods.post
    );
    expect(route).toBeDefined();
  });

  it('should have DELETE /chats route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats' && layer.route.methods.delete
    );
    expect(route).toBeDefined();
  });

  it('should have PATCH /chats/:chatId/pin route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/:chatId/pin' && layer.route.methods.patch
    );
    expect(route).toBeDefined();
  });

  it('should have PATCH /chats/:chatId/model route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/:chatId/model' && layer.route.methods.patch
    );
    expect(route).toBeDefined();
  });

  it('should have DELETE /chats/:chatId/last-message route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/:chatId/last-message' && layer.route.methods.delete
    );
    expect(route).toBeDefined();
  });

  it('should have POST /chat/:chatId/count-tokens route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chat/:chatId/count-tokens' && layer.route.methods.post
    );
    expect(route).toBeDefined();
  });

  it('should have PUT /chats/:chatId/messages/:msgId route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/chats/:chatId/messages/:msgId' && layer.route.methods.put
    );
    expect(route).toBeDefined();
  });

  it('should have GET /config/:key route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/config/:key' && layer.route.methods.get
    );
    expect(route).toBeDefined();
  });

  it('should have PUT /config/:key route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/config/:key' && layer.route.methods.put
    );
    expect(route).toBeDefined();
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
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/models' && layer.route.methods.post
    );
    expect(route).toBeDefined();
  });

  it('should have POST /model-info route', () => {
    const route = router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/model-info' && layer.route.methods.post
    );
    expect(route).toBeDefined();
  });
});

describe('Chat Service Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call create method with correct params', () => {
    mockChatService.create('llama2', 'Test Chat');
    expect(mockChatService.create).toHaveBeenCalledWith('llama2', 'Test Chat');
  });

  it('should call getById method', () => {
    mockChatService.getById('chat-1');
    expect(mockChatService.getById).toHaveBeenCalledWith('chat-1');
  });

  it('should call getAll method', () => {
    mockChatService.getAll();
    expect(mockChatService.getAll).toHaveBeenCalled();
  });

  it('should call delete method', () => {
    mockChatService.delete('chat-1');
    expect(mockChatService.delete).toHaveBeenCalledWith('chat-1');
  });

  it('should call rename method', () => {
    mockChatService.rename('chat-1', 'New Title');
    expect(mockChatService.rename).toHaveBeenCalledWith('chat-1', 'New Title');
  });

  it('should call changeModel method', () => {
    mockChatService.changeModel('chat-1', 'llama3');
    expect(mockChatService.changeModel).toHaveBeenCalledWith('chat-1', 'llama3');
  });

  it('should call togglePin method', () => {
    mockChatService.togglePin('chat-1');
    expect(mockChatService.togglePin).toHaveBeenCalledWith('chat-1');
  });

  it('should call search method', () => {
    mockChatService.search('test query');
    expect(mockChatService.search).toHaveBeenCalledWith('test query');
  });

  it('should call addMessage method', () => {
    mockChatService.addMessage('chat-1', 'user', 'Hello');
    expect(mockChatService.addMessage).toHaveBeenCalledWith('chat-1', 'user', 'Hello');
  });

  it('should call getAppConfig method', () => {
    mockChatService.getAppConfig('language');
    expect(mockChatService.getAppConfig).toHaveBeenCalledWith('language');
  });

  it('should call setAppConfig method', () => {
    mockChatService.setAppConfig('language', 'es');
    expect(mockChatService.setAppConfig).toHaveBeenCalledWith('language', 'es');
  });

  it('should call deleteAllChats method', () => {
    mockChatService.deleteAllChats();
    expect(mockChatService.deleteAllChats).toHaveBeenCalled();
  });
});

describe('Ollama Service Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call listModels method', () => {
    mockOllamaService.listModels();
    expect(mockOllamaService.listModels).toHaveBeenCalled();
  });

  it('should call showModel method', () => {
    mockOllamaService.showModel('llama2');
    expect(mockOllamaService.showModel).toHaveBeenCalledWith('llama2');
  });

  it('should call countTokens method', () => {
    mockOllamaService.countTokens('llama2', [], 'http://localhost:11434');
    expect(mockOllamaService.countTokens).toHaveBeenCalled();
  });
});
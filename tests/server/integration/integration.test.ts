import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';

const mockChatService = {
  create: vi.fn((model, title) => ({ 
    id: 'chat-1', 
    model, 
    title, 
    toJSON: () => ({ id: 'chat-1', model, title }) 
  })),
  getById: vi.fn(),
  getAll: vi.fn().mockReturnValue([]),
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
  listModels: vi.fn().mockResolvedValue([
    { name: 'llama2', size: 3826793472, modified_at: '2024-01-01' },
    { name: 'mistral', size: 4109854720, modified_at: '2024-01-02' }
  ]),
  showModel: vi.fn().mockResolvedValue({
    family: 'llama',
    parameter_size: '7B',
    quantization_level: 'Q4_0',
    format: 'gguf',
    families: ['llama'],
    size_vram: 4000000000,
    context_length: 4096
  }),
  sendMessage: vi.fn().mockResolvedValue({
    response: 'Test response from model',
    promptTokens: 10,
    responseTokens: 20,
    totalDurationMs: 5000,
    tokensPerSecond: 4
  }),
  countTokens: vi.fn().mockResolvedValue({
    promptTokens: 15
  })
};

vi.mock('../services/ChatService.js', () => ({
  ChatService: function() { return mockChatService; }
}));

vi.mock('../services/OllamaService.js', () => ({
  OllamaService: function() { return mockOllamaService; }
}));

describe('API Integration Tests', () => {
  let app: Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { createChatRoutes } = await import('../../../server/src/routes/chatRoutes.js');
    const { createModelRoutes } = await import('../../../server/src/routes/modelRoutes.js');
    const { ChatService } = await import('../../../server/src/services/ChatService.js');
    const { OllamaService } = await import('../../../server/src/services/OllamaService.js');
    
    app = express();
    app.use(express.json());
    
    const chatService = new ChatService();
    const ollamaService = new OllamaService();
    
    app.use('/api', createChatRoutes(chatService, ollamaService));
    app.use('/api', createModelRoutes(ollamaService));
  });

  describe('POST /api/new-chat', () => {
    it('should create a new chat', async () => {
      const response = await request(app)
        .post('/api/new-chat')
        .send({ model: 'llama2', title: 'Test Chat' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when model is missing', async () => {
      const response = await request(app)
        .post('/api/new-chat')
        .send({ title: 'Test' });
      
      expect(response.status).toBe(400);
    });

    it('should return 400 when title is missing', async () => {
      const response = await request(app)
        .post('/api/new-chat')
        .send({ model: 'llama2' });
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/chats', () => {
    it('should return all chats', async () => {
      const response = await request(app).get('/api/chats');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/models', () => {
    it('should return list of models', async () => {
      const response = await request(app)
        .post('/api/models')
        .send({ ollamaUrl: 'http://localhost:11434' });
      
      expect(response.status).toBe(200);
      expect(response.body.models).toBeDefined();
    });

    it('should return 400 for invalid URL', async () => {
      const response = await request(app)
        .post('/api/models')
        .send({ ollamaUrl: 'invalid' });
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/model-info', () => {
    it('should return 400 when model is missing', async () => {
      const response = await request(app)
        .post('/api/model-info')
        .send({ ollamaUrl: 'http://localhost:11434' });
      
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid URL', async () => {
      const response = await request(app)
        .post('/api/model-info')
        .send({ ollamaUrl: 'invalid', model: 'llama2' });
      
      expect(response.status).toBe(400);
    });

    it('should return error for non-existent model', async () => {
      const response = await request(app)
        .post('/api/model-info')
        .send({ ollamaUrl: 'http://localhost:11434', model: 'nonexistent-model-123' });
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/chats/search', () => {
    it('should return 400 when q is missing', async () => {
      const response = await request(app).get('/api/chats/search');
      
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/chats', () => {
    it('should delete all chats', async () => {
      const response = await request(app).delete('/api/chats');
      
      expect(response.status).toBe(200);
    });
  });
});

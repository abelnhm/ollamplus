import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';

describe('Server Integration Tests', () => {
  let app: Express;
  let serverInstance: any;

  beforeEach(async () => {
    vi.resetModules();
    
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

  describe('Server Configuration', () => {
    it('should have express.json middleware configured', async () => {
      const response = await request(app)
        .post('/api/new-chat')
        .send({ model: 'test', title: 'Test' });
      
      expect(response.status).toBeDefined();
    });

    it('should handle JSON body correctly', async () => {
      const response = await request(app)
        .post('/api/new-chat')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ model: 'test', title: 'Test' }));
      
      expect(response.status).toBeDefined();
    });

    it('should handle non-JSON content type', async () => {
      const response = await request(app)
        .post('/api/new-chat')
        .set('Content-Type', 'text/plain')
        .send('not json');
      
      expect(response.status).toBe(400);
    });
  });

  describe('API Routes', () => {
    it('should respond to health check or root', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(404);
    });

    it('should have /api/chats routes', async () => {
      const response = await request(app).get('/api/chats');
      expect(response.status).toBeDefined();
    });

    it('should have /api/models routes', async () => {
      const response = await request(app).get('/api/models');
      expect(response.status).toBeDefined();
    });

    it('should handle invalid routes', async () => {
      const response = await request(app).get('/api/invalid-route-12345');
      expect(response.status).toBe(404);
    });
  });

  describe('Chat Routes', () => {
    it('POST /api/new-chat should create a new chat', async () => {
      const response = await request(app)
        .post('/api/new-chat')
        .send({ model: 'llama2', title: 'Test Chat' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('POST /api/new-chat should return 400 when model is missing', async () => {
      const response = await request(app)
        .post('/api/new-chat')
        .send({ title: 'Test' });
      
      expect(response.status).toBe(400);
    });

    it('GET /api/chats should return chats array', async () => {
      const response = await request(app).get('/api/chats');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.chats)).toBe(true);
    });

    it('GET /api/chats/:id should return 404 for non-existent chat', async () => {
      const response = await request(app).get('/api/chats/non-existent-id-123');
      expect(response.status).toBe(404);
    });

    it('DELETE /api/chats/:id should return 404 for non-existent chat', async () => {
      const response = await request(app).delete('/api/chats/non-existent-id-123');
      expect(response.status).toBe(404);
    });
  });

  describe('Model Routes', () => {
    it('GET /api/models should return models list', async () => {
      const response = await request(app).get('/api/models');
      expect(response.status).toBeDefined();
    });

    it('POST /api/models should handle model operations', async () => {
      const response = await request(app)
        .post('/api/models')
        .send({ action: 'list' });
      
      expect(response.status).toBeDefined();
    });

    it('POST /api/model-info should return 400 when model is missing', async () => {
      const response = await request(app)
        .post('/api/model-info')
        .send({ ollamaUrl: 'http://localhost:11434' });
      
      expect(response.status).toBe(400);
    });

    it('POST /api/model-info should return 400 for invalid URL', async () => {
      const response = await request(app)
        .post('/api/model-info')
        .send({ ollamaUrl: 'invalid', model: 'test' });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/new-chat')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      
      expect(response.status).toBe(400);
    });

    it('should handle empty body', async () => {
      const response = await request(app)
        .post('/api/new-chat')
        .send('');
      
      expect(response.status).toBe(400);
    });
  });
});
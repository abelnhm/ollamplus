import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const originalEnv = { ...process.env };

describe('Config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should have default values when env vars are not set', async () => {
    vi.resetModules();
    delete process.env.PORT;
    delete process.env.OLLAMA_HOST;
    delete process.env.DB_PATH;
    delete process.env.NODE_ENV;
    delete process.env.LOG_LEVEL;

    const { config_ } = await import('../../../server/src/config.js');
    
    expect(config_.port).toBeDefined();
    expect(config_.ollamaHost).toBeDefined();
    expect(config_.dbPath).toBeDefined();
    expect(config_.nodeEnv).toBeDefined();
    expect(config_.logLevel).toBeDefined();
  });

  it('should have correct default port', async () => {
    vi.resetModules();
    delete process.env.PORT;
    const { config_ } = await import('../../../server/src/config.js');
    expect(config_.port).toBe(3000);
  });

  it('should have correct default ollamaHost', async () => {
    vi.resetModules();
    delete process.env.OLLAMA_HOST;
    const { config_ } = await import('../../../server/src/config.js');
    expect(config_.ollamaHost).toBe('http://localhost:11434');
  });

  it('should have correct default dbPath', async () => {
    vi.resetModules();
    delete process.env.DB_PATH;
    const { config_ } = await import('../../../server/src/config.js');
    expect(config_.dbPath).toBe('./data/ollama.db');
  });

  it('should have correct default nodeEnv when not set', async () => {
    vi.resetModules();
    delete process.env.NODE_ENV;
    const { config_ } = await import('../../../server/src/config.js');
    expect(config_.nodeEnv).toBe('development');
  });

  it('should use custom nodeEnv when set', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    const { config_ } = await import('../../../server/src/config.js');
    expect(config_.nodeEnv).toBe('production');
  });

  it('should have correct default logLevel', async () => {
    vi.resetModules();
    delete process.env.LOG_LEVEL;
    const { config_ } = await import('../../../server/src/config.js');
    expect(config_.logLevel).toBe('info');
  });
});

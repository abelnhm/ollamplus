import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../middlewares/errorHandler.js';
import { expressLogger, logger } from '../middlewares/logger.js';
import { Request, Response, NextFunction } from 'express';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(logger, 'info').mockImplementation(() => {});
});

describe('Error Handler Middleware', () => {
  it('should handle error with status', () => {
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    const error = new Error('Test error') as Error & { status: number };
    error.status = 404;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Test error' });
  });

  it('should handle error without status (default 500)', () => {
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    const error = new Error('Internal error');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal error' });
  });

  it('should handle error with custom message for 500', () => {
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    const error = {} as Error & { status?: number };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('Express Logger Middleware', () => {
  it('should call next()', () => {
    const req = { method: 'GET', url: '/test' } as Request;
    const res = {
      statusCode: 200,
      on: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    expressLogger(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should log on finish event', () => {
    const mockOn = vi.fn();
    const req = { method: 'POST', url: '/api/test' } as Request;
    const res = {
      statusCode: 201,
      on: mockOn
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    expressLogger(req, res, next);

    expect(mockOn).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should call logger with correct data on finish', () => {
    const mockOn = vi.fn((event, callback) => {
      if (event === 'finish') {
        callback();
      }
    });
    vi.spyOn(logger, 'info');
    const req = { method: 'GET', url: '/test' } as Request;
    const res = {
      statusCode: 200,
      on: mockOn
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    expressLogger(req, res, next);

    expect(logger.info).toHaveBeenCalled();
  });
});

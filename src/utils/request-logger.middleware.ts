import { NextFunction, Request, Response } from 'express';
import { getChildLogger } from './logger';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      log: ReturnType<typeof getChildLogger>;
    }
  }
}

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const correlationId = (req.headers['x-request-id'] as string) || randomUUID();
  const userId = (req as any).user?.id; // populated by auth middleware when available
  req.log = getChildLogger({ correlationId, userId, method: req.method, path: req.path });
  
  const start = Date.now();
  req.log.info('Incoming request');
  
  _res.on('finish', () => {
    req.log.info({ status: _res.statusCode, ms: Date.now() - start }, 'Request completed');
  });
  
  next();
}


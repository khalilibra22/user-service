import { NextFunction, Request, Response } from 'express';
import { getChildLogger } from './logger';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      log: ReturnType<typeof getChildLogger>;
      reqId?: string;
    }
  }
}

const isDev = process.env.NODE_ENV !== 'production';
const sampleRate = parseFloat(process.env.REQUEST_LOG_SAMPLE_RATE || '0');
const excludedPathsStr = process.env.REQUEST_LOG_EXCLUDE_PATHS || '/,/health,/metrics,/favicon.ico';
const excludedPaths = new Set(excludedPathsStr.split(',').map(p => p.trim()));

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || randomUUID();
  req.reqId = reqId;
  
  // Set X-Request-Id header on response
  res.setHeader('X-Request-Id', reqId);
  
  const userId = (req as any).user?.id; // populated by auth middleware when available
  req.log = getChildLogger({ reqId, userId, method: req.method, path: req.path });
  
  const start = Date.now();
  
  // In dev, log request start; in prod, skip it
  if (isDev) {
    req.log.info('Incoming request');
  }
  
  res.on('finish', () => {
    const status = res.statusCode;
    const durationMs = Date.now() - start;
    
    // Determine if we should log this request completion
    const shouldLog = (() => {
      // Always log in dev
      if (isDev) return true;
      
      // Always log errors (4xx/5xx)
      if (status >= 400) return true;
      
      // Skip excluded paths
      if (excludedPaths.has(req.path)) return false;
      
      // Sample successful requests based on rate
      return Math.random() < sampleRate;
    })();
    
    if (shouldLog) {
      req.log.info({ status, durationMs }, 'Request completed');
    }
  });
  
  next();
}


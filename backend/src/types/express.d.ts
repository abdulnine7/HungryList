import type { SessionContext } from '../services/auth-service.js';

declare global {
  namespace Express {
    interface Request {
      sessionContext?: SessionContext;
    }
  }
}

export {};

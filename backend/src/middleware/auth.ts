import type { NextFunction, Request, Response } from 'express';

import { SESSION_COOKIE_NAME, getSessionFromToken } from '../services/auth-service.js';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  const session = getSessionFromToken(token);

  if (!session) {
    res.status(401).json({
      code: 'AUTH_REQUIRED',
      message: 'Please log in with your PIN to continue.',
    });
    return;
  }

  req.sessionContext = session;
  next();
};

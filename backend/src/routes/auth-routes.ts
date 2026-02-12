import { Router } from 'express';
import { z } from 'zod';

import { env } from '../config/env.js';
import { getClearCookieOptions, getSessionCookieOptions } from '../config/cookies.js';
import {
  SESSION_COOKIE_NAME,
  clearFailedAttempts,
  createSession,
  getClientIp,
  getLockStatus,
  getSessionFromToken,
  recordFailedAttempt,
  revokeAllSessions,
  revokeSessionByToken,
} from '../services/auth-service.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const loginSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits.'),
  trusted: z.boolean().optional().default(true),
});

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const ip = getClientIp(req.ip);

    const lockStatus = getLockStatus(ip);
    if (lockStatus.blocked) {
      res.status(429).json({
        code: 'AUTH_IP_BLOCKED',
        message: `Too many failed attempts. Try again after ${lockStatus.blockedUntil}.`,
      });
      return;
    }

    if (body.pin !== env.HUNGRYLIST_PIN) {
      const failure = recordFailedAttempt(ip);

      if (failure.blocked) {
        res.status(429).json({
          code: 'AUTH_IP_BLOCKED',
          message: `Too many failed attempts. Try again after ${failure.blockedUntil}.`,
        });
        return;
      }

      res.status(401).json({
        code: 'INVALID_PIN',
        message: `PIN is incorrect. ${failure.remainingAttempts} attempt(s) remaining before lockout.`,
      });
      return;
    }

    clearFailedAttempts(ip);

    const session = createSession(ip, req.headers['user-agent'] || 'unknown', body.trusted);
    res.cookie(SESSION_COOKIE_NAME, session.token, getSessionCookieOptions(body.trusted));

    res.json({
      authenticated: true,
      trusted: body.trusted,
      expiresAt: session.expiresAt,
    });
  }),
);

authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    const session = getSessionFromToken(token);

    if (!session) {
      res.status(401).json({
        code: 'AUTH_REQUIRED',
        message: 'Please log in with your PIN to continue.',
      });
      return;
    }

    res.json({
      authenticated: true,
      trusted: session.trusted,
      expiresAt: session.expiresAt,
    });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    revokeSessionByToken(token);
    res.clearCookie(SESSION_COOKIE_NAME, getClearCookieOptions());
    res.status(204).send();
  }),
);

authRouter.post(
  '/logout-all',
  requireAuth,
  asyncHandler(async (_req, res) => {
    revokeAllSessions();
    res.clearCookie(SESSION_COOKIE_NAME, getClearCookieOptions());
    res.status(204).send();
  }),
);

import type { CookieOptions } from 'express';

import { env } from './env.js';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const getSessionCookieOptions = (trusted: boolean): CookieOptions => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  ...(trusted ? { maxAge: ONE_YEAR_MS } : { maxAge: ONE_DAY_MS }),
});

export const getClearCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

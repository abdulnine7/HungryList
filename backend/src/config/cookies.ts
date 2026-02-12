import type { CookieOptions } from 'express';

import { env } from './env.js';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const shouldUseSecureCookies = (requestIsSecure: boolean): boolean => {
  return env.COOKIE_SECURE || requestIsSecure;
};

export const getSessionCookieOptions = (trusted: boolean, requestIsSecure: boolean): CookieOptions => ({
  httpOnly: true,
  secure: shouldUseSecureCookies(requestIsSecure),
  sameSite: 'lax',
  path: '/',
  ...(trusted ? { maxAge: ONE_YEAR_MS } : { maxAge: ONE_DAY_MS }),
});

export const getClearCookieOptions = (requestIsSecure: boolean): CookieOptions => ({
  httpOnly: true,
  secure: shouldUseSecureCookies(requestIsSecure),
  sameSite: 'lax',
  path: '/',
});

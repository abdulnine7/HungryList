import crypto from 'node:crypto';

import { nanoid } from 'nanoid';

import { env } from '../config/env.js';
import { db } from '../db/client.js';
import { addDays, addHours, toIso } from '../utils/dates.js';

const MAX_FAILURES = 3;
const BLOCK_HOURS = 6;
const TRUSTED_SESSION_DAYS = 365;
const STANDARD_SESSION_DAYS = 1;

export const SESSION_COOKIE_NAME = 'hungrylist_session';

export type SessionContext = {
  id: string;
  trusted: boolean;
  expiresAt: string;
};

type FailureRecord = {
  ip: string;
  failure_count: number;
  first_failed_at: string;
  last_failed_at: string;
  blocked_until: string | null;
};

const hashToken = (token: string): string => {
  return crypto.createHmac('sha256', env.SESSION_SECRET).update(token).digest('hex');
};

export const getClientIp = (input: string | undefined): string => {
  if (!input) {
    return 'unknown';
  }

  return input.split(',')[0]?.trim() || 'unknown';
};

export const getLockStatus = (ip: string): { blocked: boolean; blockedUntil?: string } => {
  const row = db
    .prepare('SELECT * FROM auth_failures WHERE ip = ?')
    .get(ip) as FailureRecord | undefined;

  if (!row?.blocked_until) {
    return { blocked: false };
  }

  const now = Date.now();
  const blockedUntilMs = Date.parse(row.blocked_until);

  if (Number.isNaN(blockedUntilMs) || blockedUntilMs <= now) {
    db.prepare('UPDATE auth_failures SET blocked_until = NULL, failure_count = 0 WHERE ip = ?').run(ip);
    return { blocked: false };
  }

  return { blocked: true, blockedUntil: row.blocked_until };
};

export const recordFailedAttempt = (
  ip: string,
): { remainingAttempts: number; blocked: boolean; blockedUntil?: string } => {
  const now = toIso();
  const existing = db
    .prepare('SELECT * FROM auth_failures WHERE ip = ?')
    .get(ip) as FailureRecord | undefined;

  if (!existing) {
    db.prepare(
      `
      INSERT INTO auth_failures(ip, failure_count, first_failed_at, last_failed_at, blocked_until)
      VALUES(@ip, 1, @now, @now, NULL)
    `,
    ).run({ ip, now });

    return { remainingAttempts: MAX_FAILURES - 1, blocked: false };
  }

  const nextFailureCount = existing.failure_count + 1;

  if (nextFailureCount >= MAX_FAILURES) {
    const blockedUntil = toIso(addHours(new Date(), BLOCK_HOURS));

    db.prepare(
      `
      UPDATE auth_failures
      SET failure_count = @failureCount,
          last_failed_at = @now,
          blocked_until = @blockedUntil
      WHERE ip = @ip
    `,
    ).run({ ip, now, blockedUntil, failureCount: nextFailureCount });

    return {
      remainingAttempts: 0,
      blocked: true,
      blockedUntil,
    };
  }

  db.prepare(
    `
    UPDATE auth_failures
    SET failure_count = @failureCount,
        last_failed_at = @now
    WHERE ip = @ip
  `,
  ).run({ ip, failureCount: nextFailureCount, now });

  return {
    remainingAttempts: MAX_FAILURES - nextFailureCount,
    blocked: false,
  };
};

export const clearFailedAttempts = (ip: string): void => {
  db.prepare('DELETE FROM auth_failures WHERE ip = ?').run(ip);
};

export const createSession = (
  ip: string,
  userAgent: string,
  trusted: boolean,
): { token: string; expiresAt: string; trusted: boolean } => {
  const token = nanoid(48);
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = trusted
    ? toIso(addDays(now, TRUSTED_SESSION_DAYS))
    : toIso(addDays(now, STANDARD_SESSION_DAYS));

  db.prepare(
    `
    INSERT INTO sessions(id, token_hash, trusted, ip, user_agent, created_at, expires_at, revoked_at)
    VALUES(@id, @tokenHash, @trusted, @ip, @userAgent, @createdAt, @expiresAt, NULL)
  `,
  ).run({
    id: nanoid(),
    tokenHash,
    trusted: trusted ? 1 : 0,
    ip,
    userAgent,
    createdAt: toIso(now),
    expiresAt,
  });

  return { token, expiresAt, trusted };
};

export const getSessionFromToken = (token?: string): SessionContext | null => {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const session = db
    .prepare(
      `
      SELECT id, trusted, expires_at
      FROM sessions
      WHERE token_hash = @tokenHash
        AND revoked_at IS NULL
        AND expires_at > @now
      LIMIT 1
    `,
    )
    .get({ tokenHash, now: toIso() }) as
    | {
        id: string;
        trusted: number;
        expires_at: string;
      }
    | undefined;

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    trusted: Boolean(session.trusted),
    expiresAt: session.expires_at,
  };
};

export const revokeSessionByToken = (token?: string): void => {
  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);
  db.prepare(
    `
    UPDATE sessions
    SET revoked_at = @now
    WHERE token_hash = @tokenHash
      AND revoked_at IS NULL
  `,
  ).run({ tokenHash, now: toIso() });
};

export const revokeAllSessions = (): void => {
  db.prepare('UPDATE sessions SET revoked_at = @now WHERE revoked_at IS NULL').run({ now: toIso() });
};

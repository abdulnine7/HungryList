import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app, resetDatabase } from './test-utils.js';

describe('auth login lockout', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('blocks IP after 3 failed attempts for 6 hours', async () => {
    const client = request(app);

    const first = await client.post('/api/auth/login').send({ pin: '0000', trusted: true });
    expect(first.status).toBe(401);

    const second = await client.post('/api/auth/login').send({ pin: '0000', trusted: true });
    expect(second.status).toBe(401);

    const third = await client.post('/api/auth/login').send({ pin: '0000', trusted: true });
    expect(third.status).toBe(429);
    expect(third.body.code).toBe('AUTH_IP_BLOCKED');

    const locked = await client.post('/api/auth/login').send({ pin: '1234', trusted: true });
    expect(locked.status).toBe(429);
  });
});

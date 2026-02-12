import { beforeEach, describe, expect, it, vi } from 'vitest';

import { login, resetDatabase } from './test-utils.js';

describe('backup collision handling', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('ignores a new backup request when another backup already exists in the same millisecond', async () => {
    const agent = await login();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-12T21:57:30.690Z'));

    try {
      const first = await agent.post('/api/backups').send({});
      expect(first.status).toBe(201);
      expect(first.body.data.filename).toBe('2026-02-12_2157_690.json');

      const second = await agent.post('/api/backups').send({});
      expect(second.status).toBe(201);
      expect(second.body.data.id).toBe(first.body.data.id);
      expect(second.body.data.filename).toBe(first.body.data.filename);

      const listed = await agent.get('/api/backups');
      expect(listed.status).toBe(200);
      expect(listed.body.data).toHaveLength(1);
      expect(listed.body.data[0].id).toBe(first.body.data.id);
    } finally {
      vi.useRealTimers();
    }
  });
});

import fs from 'node:fs';
import path from 'node:path';
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

  it('deletes backup from database and disk', async () => {
    const agent = await login();

    const created = await agent.post('/api/backups').send({});
    expect(created.status).toBe(201);

    const backupId = created.body.data.id as string;
    const filename = created.body.data.filename as string;
    const backupDir = process.env.BACKUP_DIR as string;
    const filePath = path.join(backupDir, filename);
    expect(fs.existsSync(filePath)).toBe(true);

    const deleted = await agent.delete(`/api/backups/${backupId}`);
    expect(deleted.status).toBe(204);
    expect(fs.existsSync(filePath)).toBe(false);

    const listed = await agent.get('/api/backups');
    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(0);
  });

  it('returns not found when deleting unknown backup', async () => {
    const agent = await login();

    const response = await agent.delete('/api/backups/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('BACKUP_NOT_FOUND');
  });
});

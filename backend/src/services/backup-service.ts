import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import { env } from '../config/env.js';
import { db } from '../db/client.js';
import { AppError } from '../utils/errors.js';
import { ensureDirectory } from '../utils/fs.js';
import { recordHistory } from './history-service.js';
import { revokeAllSessions } from './auth-service.js';

type BackupRecord = {
  id: string;
  filename: string;
  reason: string;
  created_at: string;
};

const backupFileSchema = z.object({
  version: z.literal(1),
  createdAt: z.string(),
  sections: z.array(z.record(z.any())),
  items: z.array(z.record(z.any())),
  historyEvents: z.array(z.record(z.any())),
});

const getTimestampSegment = (now: Date): string => {
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const millis = String(now.getUTCMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}_${hours}${minutes}_${millis}`;
};

export const listBackups = (): BackupRecord[] => {
  return db
    .prepare('SELECT id, filename, reason, created_at FROM backups ORDER BY created_at DESC')
    .all() as BackupRecord[];
};

export const createBackup = (reason = 'manual'): BackupRecord => {
  ensureDirectory(env.BACKUP_DIR);

  const now = new Date();
  const timestampSegment = getTimestampSegment(now);
  const id = timestampSegment;
  const createdAt = now.toISOString();
  const filename = `${timestampSegment}.json`;

  const existing = db
    .prepare('SELECT id, filename, reason, created_at FROM backups WHERE filename = @filename LIMIT 1')
    .get({ filename }) as BackupRecord | undefined;

  if (existing) {
    return existing;
  }

  const filePath = path.join(env.BACKUP_DIR, filename);

  const sections = db.prepare('SELECT * FROM sections').all();
  const items = db.prepare('SELECT * FROM items').all();
  const historyEvents = db.prepare('SELECT * FROM history_events').all();

  const payload = {
    version: 1,
    createdAt,
    sections,
    items,
    historyEvents,
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');

  db.prepare('INSERT INTO backups(id, filename, reason, created_at) VALUES(@id, @filename, @reason, @createdAt)').run({
    id,
    filename,
    reason,
    createdAt,
  });

  recordHistory('backup', id, 'created', { filename, reason });

  return {
    id,
    filename,
    reason,
    created_at: createdAt,
  };
};

export const deleteBackup = (backupId: string): void => {
  const target = db
    .prepare('SELECT id, filename FROM backups WHERE id = ? LIMIT 1')
    .get(backupId) as
    | {
        id: string;
        filename: string;
      }
    | undefined;

  if (!target) {
    throw new AppError(404, 'BACKUP_NOT_FOUND', 'Backup not found.');
  }

  const targetPath = path.join(env.BACKUP_DIR, target.filename);

  try {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  } catch (error) {
    throw new AppError(500, 'BACKUP_DELETE_FAILED', 'Failed to delete backup file from disk.', String(error));
  }

  db.prepare('DELETE FROM backups WHERE id = @id').run({ id: backupId });
  recordHistory('backup', backupId, 'deleted', { filename: target.filename });
};

export const restoreBackup = (
  backupId: string,
  options?: { createCurrentBackup?: boolean },
): { restoredBackupId: string; createdSafetyBackupId?: string } => {
  const target = db
    .prepare('SELECT id, filename FROM backups WHERE id = ? LIMIT 1')
    .get(backupId) as
    | {
        id: string;
        filename: string;
      }
    | undefined;

  if (!target) {
    throw new AppError(404, 'BACKUP_NOT_FOUND', 'Backup not found.');
  }

  const targetPath = path.join(env.BACKUP_DIR, target.filename);

  if (!fs.existsSync(targetPath)) {
    throw new AppError(404, 'BACKUP_FILE_MISSING', 'Backup file is missing on disk.');
  }

  const parsed = backupFileSchema.safeParse(JSON.parse(fs.readFileSync(targetPath, 'utf8')));

  if (!parsed.success) {
    throw new AppError(400, 'INVALID_BACKUP_FILE', 'Selected backup file is invalid.');
  }

  let safetyBackupId: string | undefined;

  if (options?.createCurrentBackup) {
    const safetyBackup = createBackup('pre_restore');
    safetyBackupId = safetyBackup.id;
  }

  const restoreTransaction = db.transaction(() => {
    db.exec('DELETE FROM history_events;');
    db.exec('DELETE FROM items;');
    db.exec('DELETE FROM sections;');

    const sectionInsert = db.prepare(
      `
      INSERT INTO sections(id, name, normalized_name, icon, color, created_at, updated_at, deleted_at)
      VALUES(@id, @name, @normalized_name, @icon, @color, @created_at, @updated_at, @deleted_at)
    `,
    );

    const itemInsert = db.prepare(
      `
      INSERT INTO items(
        id,
        section_id,
        name,
        normalized_name,
        description,
        priority,
        remind_every_days,
        checked,
        favorite,
        running_low,
        last_checked_at,
        created_at,
        updated_at,
        deleted_at
      ) VALUES(
        @id,
        @section_id,
        @name,
        @normalized_name,
        @description,
        @priority,
        @remind_every_days,
        @checked,
        @favorite,
        @running_low,
        @last_checked_at,
        @created_at,
        @updated_at,
        @deleted_at
      )
    `,
    );

    const historyInsert = db.prepare(
      `
      INSERT INTO history_events(id, entity_type, entity_id, action, payload_json, created_at)
      VALUES(@id, @entity_type, @entity_id, @action, @payload_json, @created_at)
    `,
    );

    for (const section of parsed.data.sections) {
      sectionInsert.run(section);
    }

    for (const item of parsed.data.items) {
      itemInsert.run(item);
    }

    for (const event of parsed.data.historyEvents) {
      historyInsert.run(event);
    }

    const activeSections = db
      .prepare('SELECT COUNT(*) as count FROM sections WHERE deleted_at IS NULL')
      .get() as { count: number };

    if (activeSections.count < 1) {
      throw new AppError(
        400,
        'INVALID_BACKUP_CONTENT',
        'Backup restore failed because it has no active sections.',
      );
    }

    revokeAllSessions();
  });

  restoreTransaction();
  recordHistory('backup', backupId, 'restored', { safetyBackupId });

  return {
    restoredBackupId: backupId,
    createdSafetyBackupId: safetyBackupId,
  };
};

export const runMonthlyBackupIfNeeded = (): void => {
  const now = new Date();
  const day = now.getDate();

  if (day !== 1) {
    return;
  }

  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const existing = db
    .prepare('SELECT id FROM backups WHERE reason = ? AND filename LIKE ? LIMIT 1')
    .get('monthly', `${monthKey}%`) as { id: string } | undefined;

  if (!existing) {
    createBackup('monthly');
  }
};

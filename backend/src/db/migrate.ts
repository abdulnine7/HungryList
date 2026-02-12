import fs from 'node:fs';
import path from 'node:path';

import type { DB } from './client.js';

const hasColumn = (db: DB, tableName: string, columnName: string): boolean => {
  const rows = db.prepare(`PRAGMA table_info(${tableName});`).all() as Array<{ name: string }>;
  return rows.some((row) => row.name === columnName);
};

const ensureLegacyCompatibility = (db: DB): void => {
  if (!hasColumn(db, 'items', 'running_low')) {
    db.exec('ALTER TABLE items ADD COLUMN running_low INTEGER NOT NULL DEFAULT 0;');
  }

  if (!hasColumn(db, 'items', 'last_checked_at')) {
    db.exec('ALTER TABLE items ADD COLUMN last_checked_at TEXT;');
  }

  if (!hasColumn(db, 'sections', 'deleted_at')) {
    db.exec('ALTER TABLE sections ADD COLUMN deleted_at TEXT;');
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sections_unique_active_name
      ON sections(normalized_name)
      WHERE deleted_at IS NULL;
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_items_unique_active_per_section_name
      ON items(section_id, normalized_name)
      WHERE deleted_at IS NULL;
  `);
};

export const runMigrations = (db: DB): void => {
  const candidates = [
    path.resolve(process.cwd(), 'src/db/migrations'),
    path.resolve(process.cwd(), 'dist/db/migrations'),
  ];
  const migrationsDir = candidates.find((candidate) => fs.existsSync(candidate));

  if (!migrationsDir) {
    throw new Error('Unable to locate migration directory.');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      executed_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    (db.prepare('SELECT version FROM schema_migrations').all() as Array<{ version: string }>).map(
      (row) => row.version,
    ),
  );

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const insertMigration = db.prepare(
    'INSERT INTO schema_migrations(version, executed_at) VALUES (?, ?)',
  );

  for (const file of migrationFiles) {
    if (applied.has(file)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    insertMigration.run(file, new Date().toISOString());
  }

  ensureLegacyCompatibility(db);
};

import path from 'node:path';
import Database from 'better-sqlite3';

import { env } from '../config/env.js';
import { ensureDirectory } from '../utils/fs.js';

const dataDir = env.DATA_DIR;
ensureDirectory(dataDir);
ensureDirectory(env.BACKUP_DIR);

const dbPath = path.join(dataDir, env.SQLITE_FILENAME);

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

export type DB = typeof db;

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hungrylist-test-'));
const dataDir = path.join(testRoot, 'data');
const backupDir = path.join(dataDir, 'backups');

fs.mkdirSync(backupDir, { recursive: true });

process.env.NODE_ENV = 'test';
process.env.APP_HOST = '127.0.0.1';
process.env.APP_PORT = '8080';
process.env.HUNGRYLIST_PIN = '1234';
process.env.SESSION_SECRET = 'test-session-secret-value';
process.env.TRUST_PROXY = 'false';
process.env.DATA_DIR = dataDir;
process.env.SQLITE_FILENAME = 'hungrylist-test.sqlite';
process.env.BACKUP_DIR = backupDir;
process.env.CORS_ALLOWLIST = 'http://localhost:5173';
process.env.COOKIE_SECURE = 'false';
process.env.FRONTEND_DIST_DIR = path.join(testRoot, 'frontend-dist');

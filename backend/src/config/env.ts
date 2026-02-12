import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_HOST: z.string().default('0.0.0.0'),
  APP_PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  HUNGRYLIST_PIN: z.string().regex(/^\d{4}$/, 'HUNGRYLIST_PIN must be exactly 4 digits'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  DATA_DIR: z.string().default('/data'),
  SQLITE_FILENAME: z.string().default('hungrylist.sqlite'),
  BACKUP_DIR: z.string().default('/data/backups'),
  CORS_ALLOWLIST: z.string().default('http://localhost:5173'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  FRONTEND_DIST_DIR: z.string().default(path.resolve(process.cwd(), '../frontend/dist')),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Environment validation failed:\n${issues.join('\n')}`);
}

const corsOrigins = parsed.data.CORS_ALLOWLIST.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  ...parsed.data,
  corsOrigins,
};

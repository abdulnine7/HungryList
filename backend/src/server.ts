import cron from 'node-cron';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { bootstrapDefaults } from './db/bootstrap.js';
import { db } from './db/client.js';
import { runMigrations } from './db/migrate.js';
import { createBackup, runMonthlyBackupIfNeeded } from './services/backup-service.js';
import { logger } from './utils/logger.js';

runMigrations(db);
bootstrapDefaults(db);
runMonthlyBackupIfNeeded();

cron.schedule('0 3 1 * *', () => {
  try {
    createBackup('monthly');
    logger.info('Monthly backup created');
  } catch (error) {
    logger.error({ err: error }, 'Monthly backup failed');
  }
});

const app = createApp();

app.listen(env.APP_PORT, env.APP_HOST, () => {
  logger.info(`HungryList server listening on http://${env.APP_HOST}:${env.APP_PORT}`);
});

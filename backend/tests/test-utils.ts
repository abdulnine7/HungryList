import request from 'supertest';

import { createApp } from '../src/app.js';
import { bootstrapDefaults } from '../src/db/bootstrap.js';
import { db } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrate.js';

runMigrations(db);

export const app = createApp();

export const resetDatabase = (): void => {
  db.exec(`
    DELETE FROM history_events;
    DELETE FROM items;
    DELETE FROM sections;
    DELETE FROM backups;
    DELETE FROM sessions;
    DELETE FROM auth_failures;
  `);

  bootstrapDefaults(db);
};

export const login = async () => {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ pin: '1234', trusted: true });
  if (response.status !== 200) {
    throw new Error('Unable to authenticate test session');
  }
  return agent;
};

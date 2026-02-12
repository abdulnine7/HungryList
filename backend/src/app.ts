import fs from 'node:fs';
import path from 'node:path';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { env } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth-routes.js';
import { backupRouter } from './routes/backup-routes.js';
import { itemRouter } from './routes/item-routes.js';
import { sectionRouter } from './routes/section-routes.js';
import { AppError } from './utils/errors.js';
import { logger } from './utils/logger.js';

export const createApp = () => {
  const app = express();

  if (env.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/healthz',
      },
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new AppError(403, 'ORIGIN_NOT_ALLOWED', 'Request origin is not allowed.'));
      },
      credentials: true,
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/sections', requireAuth, sectionRouter);
  app.use('/api/items', requireAuth, itemRouter);
  app.use('/api/backups', requireAuth, backupRouter);

  const staticDir = path.resolve(env.FRONTEND_DIST_DIR);
  if (fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/healthz') {
        next();
        return;
      }

      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

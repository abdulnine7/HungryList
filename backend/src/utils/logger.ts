import pino from 'pino';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let transport: pino.TransportSingleOptions | undefined;

if (process.env.NODE_ENV === 'development') {
  try {
    require.resolve('pino-pretty');
    transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        singleLine: true,
      },
    };
  } catch {
    transport = undefined;
  }
}

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport,
  redact: {
    paths: ['req.headers.cookie', 'res.headers["set-cookie"]'],
    censor: '[REDACTED]',
  },
});

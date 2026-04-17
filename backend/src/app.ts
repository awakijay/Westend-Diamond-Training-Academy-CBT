import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { apiRouter } from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { notFoundHandler } from './common/middleware/not-found.js';
import { resolveFromProjectRoot } from './config/paths.js';

export const app = express();
const uploadsDirectory = resolveFromProjectRoot(env.UPLOADS_DIR);
const allowedOrigins = new Set(env.CORS_ORIGINS);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(uploadsDirectory)));

app.get('/', (_req, res) => {
  res.json({
    name: 'Westend Diamond Training Academy CBT Backend',
    status: 'ok',
    docs: '/api/health',
  });
});

app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

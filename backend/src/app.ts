import cors from 'cors';
import express from 'express';
import { apiRouter } from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { notFoundHandler } from './common/middleware/not-found.js';

export const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

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


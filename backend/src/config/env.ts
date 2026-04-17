import 'dotenv/config';
import { z } from 'zod';

const parseCorsOrigins = (value: string) =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).default('westend-diamond-cbt-local-secret'),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),
  ADMIN_SEED_USERNAME: z.string().min(1).default('admin'),
  ADMIN_SEED_PASSWORD: z.string().min(1).default('admin123'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  UPLOAD_PROVIDER: z.string().min(1).default('local'),
  DATA_DIR: z.string().min(1).default('data'),
  UPLOADS_DIR: z.string().min(1).default('data/uploads'),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  CORS_ORIGINS: parseCorsOrigins(parsedEnv.CORS_ORIGIN),
};

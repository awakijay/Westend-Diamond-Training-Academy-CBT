import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),
  ADMIN_SEED_USERNAME: z.string().min(1).optional(),
  ADMIN_SEED_PASSWORD: z.string().min(1).optional(),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  UPLOAD_PROVIDER: z.string().min(1).default('local'),
});

export const env = envSchema.parse(process.env);


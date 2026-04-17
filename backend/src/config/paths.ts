import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const projectRoot = path.resolve(currentDir, '..', '..');

export const resolveFromProjectRoot = (...segments: string[]) =>
  path.resolve(projectRoot, ...segments);

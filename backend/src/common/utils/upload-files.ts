import { promises as fs, type Dirent } from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env.js';
import { resolveFromProjectRoot } from '../../config/paths.js';
import type { DataStore } from '../../lib/store.js';

const uploadsDirectory = resolveFromProjectRoot(env.UPLOADS_DIR);
const uploadRoutePrefix = '/uploads/';

const getLocalUploadKey = (value?: string | null) => {
  if (!value) {
    return null;
  }

  try {
    const pathname = new URL(value).pathname;
    return pathname.startsWith(uploadRoutePrefix) ? pathname : null;
  } catch {
    return value.startsWith(uploadRoutePrefix) ? value : null;
  }
};

const getReferencedUploadKeys = (store: DataStore) => {
  const keys = new Set<string>();

  store.questions.forEach((question) => {
    const key = getLocalUploadKey(question.imageUrl);

    if (key) {
      keys.add(key);
    }
  });

  store.sessionQuestions.forEach((question) => {
    const key = getLocalUploadKey(question.imageUrlSnapshot);

    if (key) {
      keys.add(key);
    }
  });

  return keys;
};

export const cleanupUnusedUploadUrls = async (
  store: DataStore,
  uploadUrls: Array<string | null | undefined>
) => {
  const candidateKeys = [
    ...new Set(
      uploadUrls
        .map((value) => getLocalUploadKey(value))
        .filter((value): value is string => Boolean(value))
    ),
  ];

  if (candidateKeys.length === 0) {
    return;
  }

  const referencedKeys = getReferencedUploadKeys(store);

  await Promise.all(
    candidateKeys
      .filter((key) => !referencedKeys.has(key))
      .map(async (key) => {
        const filename = path.basename(key);
        const filePath = path.join(uploadsDirectory, filename);

        try {
          await fs.unlink(filePath);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
          }
        }
      })
  );
};

export const clearAllUploadedFiles = async () => {
  let entries: Dirent[];

  try {
    entries = await fs.readdir(uploadsDirectory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return 0;
    }

    throw error;
  }

  for (const entry of entries) {
    await fs.rm(path.join(uploadsDirectory, entry.name), {
      force: true,
      recursive: true,
    });
  }

  return entries.length;
};

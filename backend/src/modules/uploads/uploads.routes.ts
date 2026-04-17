import { Router } from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { createHttpError } from '../../common/errors/http-error.js';
import { env } from '../../config/env.js';
import { resolveFromProjectRoot } from '../../config/paths.js';

const router = Router();
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
  },
});
const uploadsDirectory = resolveFromProjectRoot(env.UPLOADS_DIR);

const sanitizeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

router.post('/question-image', upload.single('file'), async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, 'A file upload is required');
  }

  if (!req.file.mimetype.startsWith('image/')) {
    throw createHttpError(400, 'Only image uploads are supported for question assets');
  }

  await fs.mkdir(uploadsDirectory, { recursive: true });

  const extension = path.extname(req.file.originalname) || '';
  const baseFilename =
    sanitizeFilename(req.file.originalname.replace(extension, '')) || 'question-image';
  const filename = `${Date.now()}-${baseFilename}${extension}`;

  await fs.writeFile(path.join(uploadsDirectory, filename), req.file.buffer);

  res.status(201).json({
    filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${filename}`,
  });
});

export default router;

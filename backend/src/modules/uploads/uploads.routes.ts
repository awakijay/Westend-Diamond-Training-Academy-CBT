import { Router } from 'express';
import multer from 'multer';
import { notImplemented } from '../../common/utils/not-implemented.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/question-image', upload.single('file'), (_req, res) => {
  return notImplemented(res, 'Question image upload', [
    'Store file in object storage or media service',
    'Return a durable URL for question records',
  ]);
});

export default router;


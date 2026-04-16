import { Router } from 'express';
import {
  generateUinsBodySchema,
  uinIdParamSchema,
  uinQuerySchema,
} from './uins.schema.js';
import { validate } from '../../common/validation/validate.js';
import { notImplemented } from '../../common/utils/not-implemented.js';

const router = Router();

router.get('/', validate({ query: uinQuerySchema }), (_req, res) => {
  return notImplemented(res, 'List UINs', [
    'Support available or used filtering',
    'Include subject assignments in the response',
  ]);
});

router.post('/generate', validate({ body: generateUinsBodySchema }), (_req, res) => {
  return notImplemented(res, 'Generate UIN batch', [
    'Generate unique TRN-prefixed codes',
    'Persist subject assignments per generated UIN',
    'Confirm the courses-per-UIN product rule before final implementation',
  ]);
});

router.delete('/:id', validate({ params: uinIdParamSchema }), (_req, res) => {
  return notImplemented(res, 'Delete or void UIN', [
    'Block deletion of used UINs unless explicitly approved by product owner',
  ]);
});

export default router;


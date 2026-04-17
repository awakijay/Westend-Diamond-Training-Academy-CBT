import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

const assignRequestValue = (
  req: Request,
  key: 'body' | 'params' | 'query',
  value: unknown
) => {
  try {
    (req as Request & Record<typeof key, unknown>)[key] = value;
  } catch {
    // Express 5 exposes req.query as a getter-only property, so we shadow it safely.
    Object.defineProperty(req, key, {
      value,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }
};

export const validate =
  (schemas: RequestSchemas) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        assignRequestValue(req, 'params', schemas.params.parse(req.params));
      }

      if (schemas.query) {
        assignRequestValue(req, 'query', schemas.query.parse(req.query));
      }

      if (schemas.body) {
        assignRequestValue(req, 'body', schemas.body.parse(req.body));
      }

      next();
    } catch (error) {
      next(error);
    }
  };

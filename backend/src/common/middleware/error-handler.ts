import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { HttpError } from '../errors/http-error.js';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file is too large. Maximum size is 5MB'
        : error.message;

    return res.status(400).json({
      message,
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message: 'Unexpected server error',
  });
};

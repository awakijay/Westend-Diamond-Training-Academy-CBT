import type { Response } from 'express';

export const notImplemented = (
  res: Response,
  capability: string,
  nextSteps: string[] = []
) => {
  return res.status(501).json({
    message: `${capability} is scaffolded for review but not implemented yet.`,
    nextSteps,
  });
};


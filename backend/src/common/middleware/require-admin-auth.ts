import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { createHttpError } from '../errors/http-error.js';
import { readStore, type AdminRecord } from '../../lib/store.js';

type AdminTokenPayload = {
  sub: string;
  username: string;
  role: string;
};

type AuthenticatedRequest = Request & {
  admin?: AdminRecord;
};

const getBearerToken = (request: Request) => {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

export const createAdminToken = (admin: AdminRecord) =>
  jwt.sign(
    {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

export const requireAdminAuth = async (
  request: Request,
  _response: Response,
  next: NextFunction
) => {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw createHttpError(401, 'Missing admin bearer token');
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as AdminTokenPayload;

    const admin = await readStore((store) =>
      store.admins.find((item) => item.id === payload.sub) ?? null
    );

    if (!admin) {
      throw createHttpError(401, 'Admin account no longer exists');
    }

    (request as AuthenticatedRequest).admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

export const getAuthenticatedAdmin = (request: Request) => {
  const admin = (request as AuthenticatedRequest).admin;

  if (!admin) {
    throw createHttpError(401, 'Admin authentication is required');
  }

  return admin;
};

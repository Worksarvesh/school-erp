import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & { requestId: string };

export const REQUEST_ID_HEADER = 'X-Request-Id';
const SAFE_ID = /^[A-Za-z0-9._-]{8,64}$/;

/** Reuses a well-formed incoming X-Request-Id, otherwise makes one; echoes it on the response. */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const requestId = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
  (req as RequestWithId).requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

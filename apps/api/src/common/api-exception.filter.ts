import {
  type ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiError } from './errors.js';
import type { RequestWithId } from './request-id.js';

/** Generic messages for built-in errors: never echo request data (it may hold passwords). */
const DEFAULTS: Record<number, { code: string; message: string }> = {
  400: { code: 'bad_request', message: 'The request is invalid' },
  401: { code: 'unauthenticated', message: 'Sign in to continue' },
  403: { code: 'forbidden', message: 'You do not have permission to do this' },
  404: { code: 'not_found', message: 'Not found' },
  413: { code: 'payload_too_large', message: 'The request is too large' },
  429: { code: 'too_many_requests', message: 'Too many requests, try again later' },
  501: { code: 'not_enabled', message: 'This feature is not enabled yet' },
};
const INTERNAL = { code: 'internal_error', message: 'Something went wrong' };

/** Turns every error into `{ "error": { code, message, requestId, details? } }`. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const body: ApiError = { ...describe(exception, status), requestId: request.requestId };

    if (status >= 500 && status !== 501) {
      // Name and code only: messages of driver/ORM errors can contain query values.
      const name = exception instanceof Error ? exception.name : typeof exception;
      const code = (exception as { code?: unknown } | null)?.code;
      this.logger.error(
        `requestId=${request.requestId} ${name}${code ? ` code=${String(code)}` : ''}`,
      );
    }
    response.status(status).json({ error: body });
  }
}

function describe(exception: unknown, status: number): Omit<ApiError, 'requestId'> {
  if (!(exception instanceof HttpException)) {
    return INTERNAL;
  }
  const payload = exception.getResponse();

  // Our own ApiException: code and message were written to be shown.
  if (
    isObject(payload) &&
    typeof payload.code === 'string' &&
    typeof payload.message === 'string'
  ) {
    return { code: payload.code, message: payload.message };
  }

  // ValidationPipe: field messages name the property, never its value.
  if (
    exception instanceof BadRequestException &&
    isObject(payload) &&
    Array.isArray(payload.message)
  ) {
    return {
      code: 'validation_failed',
      message: 'The request has invalid fields',
      details: payload.message.map(String),
    };
  }

  return DEFAULTS[status] ?? (status >= 500 ? INTERNAL : DEFAULTS[400]!);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

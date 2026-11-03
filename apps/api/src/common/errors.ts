import { HttpException, HttpStatus } from '@nestjs/common';

/** Body of every error response: `{ "error": ApiError }`. */
export interface ApiError {
  code: string;
  message: string;
  requestId: string;
  details?: string[];
}

/** An error whose code and message are safe to show to the client. */
export class ApiException extends HttpException {
  constructor(status: HttpStatus, code: string, message: string) {
    super({ code, message }, status);
  }
}

/** A feature the design defines but that is not built yet (for example anything needing OTP). */
export class NotEnabledException extends ApiException {
  constructor(feature: string) {
    super(HttpStatus.NOT_IMPLEMENTED, 'not_enabled', `${feature} is not enabled yet`);
  }
}

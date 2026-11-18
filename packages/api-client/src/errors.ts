export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  requestId?: string;
  details?: ApiErrorDetail[];
}

export interface BackendErrorResponse {
  error: ApiErrorPayload;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: ApiErrorDetail[];

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || `API Error: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code || 'UNKNOWN_ERROR';
    this.requestId = payload.requestId;
    this.details = payload.details;
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

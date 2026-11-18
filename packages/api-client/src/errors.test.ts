import { describe, it, expect } from 'vitest';
import { ApiError } from './errors.js';

describe('ApiError', () => {
  it('constructs with status and payload', () => {
    const error = new ApiError(401, {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password',
      requestId: 'req-123',
    });

    expect(error.status).toBe(401);
    expect(error.code).toBe('INVALID_CREDENTIALS');
    expect(error.message).toBe('Invalid username or password');
    expect(error.requestId).toBe('req-123');
    expect(ApiError.isApiError(error)).toBe(true);
  });
});

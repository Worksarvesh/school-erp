import { describe, it, expect } from 'vitest';
import { createQueryClient } from './query-client.js';

describe('createQueryClient', () => {
  it('disables mutation retry to protect non-idempotent writes', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.mutations?.retry).toBe(false);
  });
});

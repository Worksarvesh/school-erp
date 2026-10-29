import { describe, expect, it } from 'vitest';
import { ROLES, isRole } from './roles.js';

describe('isRole', () => {
  it('accepts every defined role', () => {
    for (const role of ROLES) expect(isRole(role)).toBe(true);
  });

  it('rejects unknown and non-string values', () => {
    expect(isRole('superuser')).toBe(false);
    expect(isRole(undefined)).toBe(false);
    expect(isRole(42)).toBe(false);
  });

  it('has no duplicate roles', () => {
    expect(new Set(ROLES).size).toBe(ROLES.length);
  });
});

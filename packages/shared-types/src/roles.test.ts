import { describe, it, expect } from 'vitest';
import { ROLES, isRole } from './roles.js';

describe('shared-types roles', () => {
  it('should define all expected roles', () => {
    expect(ROLES).toContain('student');
    expect(ROLES).toContain('parent');
    expect(ROLES).toContain('teacher');
    expect(ROLES).toContain('principal');
  });

  it('should validate role strings correctly', () => {
    expect(isRole('student')).toBe(true);
    expect(isRole('UNKNOWN_ROLE')).toBe(false);
  });
});

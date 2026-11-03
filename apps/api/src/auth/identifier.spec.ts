import { normalizeIdentifier } from './identifier.js';

describe('normalizeIdentifier', () => {
  it.each([
    ['9876543210', '+919876543210'],
    ['98765 43210', '+919876543210'],
    ['+91 98765-43210', '+919876543210'],
    ['09876543210', '+919876543210'],
    ['+14155552671', '+14155552671'],
  ])('normalises phone %s to E.164', (input, expected) => {
    expect(normalizeIdentifier(input)).toBe(expected);
  });

  it('lower-cases and trims email', () => {
    expect(normalizeIdentifier('  Asha.Rao@Example.TEST ')).toBe('asha.rao@example.test');
  });

  it.each(['', '12', 'not-an-email@', '@x.com', 'hello', '%', '+91%'])(
    'returns null for %j',
    (input) => {
      expect(normalizeIdentifier(input)).toBeNull();
    },
  );
});

import { describe, it, expect } from 'vitest';
import { lightPalette, darkPalette } from './theme/colors.js';
import { spacing, radii } from './theme/spacing.js';
import { typography } from './theme/typography.js';

describe('UI Design Tokens', () => {
  it('should provide light and dark palette definitions', () => {
    expect(lightPalette.primary).toBeDefined();
    expect(darkPalette.primary).toBeDefined();
    expect(lightPalette.background).not.toEqual(darkPalette.background);
  });

  it('should define consistent spacing and radius scale', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.base).toBe(16);
    expect(radii.md).toBe(8);
  });

  it('should define consistent typography scales', () => {
    expect(typography.fontSizes['3xl']).toBeGreaterThan(typography.fontSizes.base);
    expect(typography.fontSizes.base).toBe(16);
  });
});

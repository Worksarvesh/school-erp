import { describe, expect, it } from 'vitest';
import { scaleFor, scaleStyles } from './theme/scale.js';

describe('scale', () => {
  it('follows the screen width within limits', () => {
    expect(scaleFor(360)).toBe(1);
    expect(scaleFor(320)).toBeCloseTo(0.889, 3);
    expect(scaleFor(240)).toBe(0.88);
    expect(scaleFor(1024)).toBe(1.15);
    expect(scaleFor(0)).toBe(1);
  });

  it('scales sizes and leaves flex, borders, min sizes and strings alone', () => {
    const fixed = { flex: 1, height: '50%', borderWidth: 1.5, minHeight: 44 };
    expect(
      scaleStyles({ a: { ...fixed, width: 100, paddingLeft: 20, fontSize: 20 } }, 0.9),
    ).toEqual({ a: { ...fixed, width: 90, paddingLeft: 18, fontSize: 18 } });
  });

  it('never shrinks small text or 1-wide dividers', () => {
    expect(scaleStyles({ a: { fontSize: 9, width: 1 } }, 0.88)).toEqual({
      a: { fontSize: 9, width: 1 },
    });
  });
});

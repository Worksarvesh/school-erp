import { isUuid, uuidv7 } from './uuid.js';

describe('uuidv7', () => {
  it('is a valid UUID with version 7 and variant 10', () => {
    const id = uuidv7();
    expect(isUuid(id)).toBe(true);
    expect(id[14]).toBe('7');
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
  });

  it('carries the millisecond timestamp, so ids sort by time', () => {
    const id = uuidv7(0x0197de000000);
    expect(id.startsWith('0197de00-0000-7')).toBe(true);
    expect(uuidv7(1_000) < uuidv7(2_000)).toBe(true);
  });

  it('is unique', () => {
    expect(new Set(Array.from({ length: 1000 }, () => uuidv7(5))).size).toBe(1000);
  });
});

import { OtpRequestLimiter } from './otp-request-limiter.js';

describe('OtpRequestLimiter', () => {
  const phone = '+919000010101';

  it('allows one request per 30 seconds', () => {
    const limiter = new OtpRequestLimiter();
    expect(limiter.tryAcquire(phone, 0)).toBe(true);
    expect(limiter.tryAcquire(phone, 29_999)).toBe(false);
    expect(limiter.tryAcquire(phone, 30_000)).toBe(true);
  });

  it('allows five requests per 15 minutes, then resets as old ones age out', () => {
    const limiter = new OtpRequestLimiter();
    for (let i = 0; i < 5; i++) {
      expect(limiter.tryAcquire(phone, i * 60_000)).toBe(true);
    }
    expect(limiter.tryAcquire(phone, 5 * 60_000)).toBe(false);
    expect(limiter.tryAcquire(phone, 15 * 60_000 + 1)).toBe(true);
  });

  it('keeps numbers apart', () => {
    const limiter = new OtpRequestLimiter();
    expect(limiter.tryAcquire(phone, 0)).toBe(true);
    expect(limiter.tryAcquire('+919000010102', 0)).toBe(true);
  });
});

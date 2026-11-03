import type { AppConfig } from '../config/app-config.js';
import { LoginFailureLimiter } from './login-failure-limiter.js';

const limiter = () => new LoginFailureLimiter({ loginFailuresPerWindow: 3 } as AppConfig);
const MINUTE = 60_000;

describe('LoginFailureLimiter', () => {
  it('blocks after the limit within 15 minutes, per key', () => {
    const l = limiter();
    for (let i = 0; i < 3; i++) l.recordFailure('+919000000001', 0);
    expect(l.isBlocked('+919000000001', MINUTE)).toBe(true);
    expect(l.isBlocked('+919000000002', MINUTE)).toBe(false);
  });

  it('lets old failures age out (no permanent lockout)', () => {
    const l = limiter();
    for (let i = 0; i < 3; i++) l.recordFailure('k', 0);
    expect(l.isBlocked('k', 15 * MINUTE)).toBe(false);
  });

  it('clears the count after a success', () => {
    const l = limiter();
    for (let i = 0; i < 3; i++) l.recordFailure('k', 0);
    l.reset('k');
    expect(l.isBlocked('k', MINUTE)).toBe(false);
  });
});

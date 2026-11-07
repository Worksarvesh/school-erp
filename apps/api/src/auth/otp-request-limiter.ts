import { Injectable } from '@nestjs/common';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const COOLDOWN_MS = 30 * 1000;
const MAX_TRACKED_KEYS = 50_000;

/**
 * OTP requests per phone number, in memory (one API instance for now; Redis with several):
 * at most one every 30 seconds and five per 15 minutes. Counts unknown numbers too, so a 429
 * says nothing about whether an account exists. Wrong codes are capped per challenge in the DB.
 */
@Injectable()
export class OtpRequestLimiter {
  private readonly requests = new Map<string, number[]>();

  /** Records the request when allowed; false means 429. */
  tryAcquire(phone: string, now = Date.now()): boolean {
    const recent = this.recent(phone, now);
    const last = recent[recent.length - 1];
    if (recent.length >= MAX_PER_WINDOW || (last !== undefined && now - last < COOLDOWN_MS)) {
      return false;
    }
    if (this.requests.size >= MAX_TRACKED_KEYS) {
      this.prune(now);
    }
    this.requests.set(phone, [...recent, now]);
    return true;
  }

  private recent(phone: string, now: number): number[] {
    return (this.requests.get(phone) ?? []).filter((t) => now - t < WINDOW_MS);
  }

  private prune(now: number): void {
    for (const key of this.requests.keys()) {
      if (this.recent(key, now).length === 0) {
        this.requests.delete(key);
      }
    }
  }
}

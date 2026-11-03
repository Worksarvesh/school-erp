import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_KEYS = 50_000;

/**
 * Failed logins per normalised identifier, in memory (one API instance for now; move to Redis
 * when there are several). Counts unknown identifiers too, so a 429 says nothing about whether
 * an account exists. No lockout: a success clears the count, and old failures age out.
 */
@Injectable()
export class LoginFailureLimiter {
  private readonly failures = new Map<string, number[]>();
  private readonly limit: number;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.limit = config.loginFailuresPerWindow;
  }

  isBlocked(key: string, now = Date.now()): boolean {
    return this.recent(key, now).length >= this.limit;
  }

  recordFailure(key: string, now = Date.now()): void {
    if (this.failures.size >= MAX_TRACKED_KEYS) {
      this.prune(now);
    }
    this.failures.set(key, [...this.recent(key, now), now]);
  }

  reset(key: string): void {
    this.failures.delete(key);
  }

  private recent(key: string, now: number): number[] {
    return (this.failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  }

  private prune(now: number): void {
    for (const key of this.failures.keys()) {
      if (this.recent(key, now).length === 0) {
        this.failures.delete(key);
      }
    }
  }
}

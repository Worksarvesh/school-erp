import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

// OWASP minimum for argon2id: 19 MiB memory, 2 iterations, 1 lane.
const OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordService {
  private dummyHash?: Promise<string>;

  /** Password rules: length only (10-128), no composition rules. */
  isAcceptable(password: string): boolean {
    return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
  }

  hash(password: string): Promise<string> {
    if (!this.isAcceptable(password)) {
      throw new Error(`Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`);
    }
    return argon2.hash(password, OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Same work as a real verify, always false. Used for unknown or disabled accounts so the
   * response time does not reveal whether an account exists.
   */
  async verifyDummy(password: string): Promise<false> {
    this.dummyHash ??= argon2.hash(randomBytes(32).toString('hex'), OPTIONS);
    await this.verify(await this.dummyHash, password);
    return false;
  }
}

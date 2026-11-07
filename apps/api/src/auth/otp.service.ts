import { createHmac } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { uuidv7 } from '../common/uuid.js';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { PrismaService } from '../database/prisma.service.js';
import { OtpProvider, type OtpPurpose } from './otp.js';

export const OTP_TTL_SECONDS = 5 * 60;

/** Result of auth_otp_verify(). */
export type OtpCheck = 'ok' | 'wrong' | 'expired' | 'locked' | 'none';

/**
 * The auth module owns `otp_challenges`, reached only through the auth_otp_issue / auth_otp_verify
 * SECURITY DEFINER functions. Stores an HMAC of the code, never the code. Expiry, the attempt cap
 * and "one open challenge per phone and purpose" live in those functions, so they hold for every
 * provider, the fixed one included.
 */
@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OtpProvider,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async issue(phone: string, purpose: OtpPurpose, ip: string | null): Promise<void> {
    const code = this.provider.newCode();
    await this.prisma.$executeRaw`
      SELECT auth_otp_issue(${uuidv7()}::uuid, ${phone}, ${purpose}::otp_purpose,
        ${this.hash(code)}, ${OTP_TTL_SECONDS}::integer, ${ip})`;
    await this.provider.deliver(phone, code, purpose);
  }

  async verify(phone: string, purposes: OtpPurpose[], code: string): Promise<OtpCheck> {
    const rows = await this.prisma.$queryRaw<{ result: OtpCheck }[]>`
      SELECT auth_otp_verify(${phone}, ${purposes}::otp_purpose[], ${this.hash(code)}) AS result`;
    return rows[0]?.result ?? 'none';
  }

  private hash(code: string): string {
    return createHmac('sha256', this.config.otpHashSecret).update(code).digest('hex');
  }
}

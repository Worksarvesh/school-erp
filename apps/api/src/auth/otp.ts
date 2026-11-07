import { Inject, Injectable } from '@nestjs/common';
import { NotEnabledException } from '../common/errors.js';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';

/** Matches the otp_purpose enum. */
export type OtpPurpose = 'principal_registration' | 'principal_login' | 'parent_login';

/**
 * Makes and delivers one-time codes. Storage, expiry, attempts and rate limits live in OtpService,
 * so swapping the fixed provider for a real SMS one changes no tables and no protections.
 */
export abstract class OtpProvider {
  /** The code for a new challenge. */
  abstract newCode(): string;
  /** Sends the code to the phone. Never logs the code. */
  abstract deliver(phone: string, code: string, purpose: OtpPurpose): Promise<void>;
}

/**
 * Interim provider (OTP_PROVIDER=fixed): every code is OTP_FIXED_CODE and nothing is sent.
 * loadAppConfig() refuses to start with it in production.
 */
@Injectable()
export class FixedOtpProvider extends OtpProvider {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    super();
  }

  newCode(): string {
    return this.config.otpFixedCode;
  }

  deliver(): Promise<void> {
    return Promise.resolve();
  }
}

/** Extra verification before sensitive actions (change phone/password, export). */
export abstract class StepUpProvider {
  /** Resolves when the user has just proved it is them; throws otherwise. */
  abstract require(userId: string, action: StepUpAction): Promise<void>;
}

export type StepUpAction = 'password_change' | 'phone_change' | 'data_export';

@Injectable()
export class DisabledStepUpProvider extends StepUpProvider {
  require(): Promise<void> {
    return Promise.reject(new NotEnabledException('Step-up verification'));
  }
}

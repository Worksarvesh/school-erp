import { Injectable } from '@nestjs/common';
import { NotEnabledException } from '../common/errors.js';

/**
 * One-time passwords (registration, password recovery). Not built yet (see docs/decisions.md):
 * the default implementation makes every OTP action answer 501 `not_enabled`.
 */
export abstract class OtpProvider {
  abstract send(phone: string, purpose: OtpPurpose): Promise<void>;
  abstract verify(phone: string, purpose: OtpPurpose, code: string): Promise<boolean>;
}

export type OtpPurpose = 'registration' | 'password_reset';

/** Extra verification before sensitive actions (change phone/password, fee refund, export). */
export abstract class StepUpProvider {
  /** Resolves when the user has just proved it is them; throws otherwise. */
  abstract require(userId: string, action: StepUpAction): Promise<void>;
}

export type StepUpAction = 'password_change' | 'phone_change' | 'fee_refund' | 'data_export';

@Injectable()
export class DisabledOtpProvider extends OtpProvider {
  send(): Promise<void> {
    return Promise.reject(new NotEnabledException('OTP'));
  }

  verify(): Promise<boolean> {
    return Promise.reject(new NotEnabledException('OTP'));
  }
}

@Injectable()
export class DisabledStepUpProvider extends StepUpProvider {
  require(): Promise<void> {
    return Promise.reject(new NotEnabledException('Step-up verification'));
  }
}

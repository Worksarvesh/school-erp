import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthProvider } from './auth-provider.js';
import { CredentialsService } from './credentials.service.js';
import { IdentityModule } from './identity.module.js';
import { LocalAuthProvider } from './local-auth.provider.js';
import { LoginFailureLimiter } from './login-failure-limiter.js';
import { MeController } from './me.controller.js';
import { DisabledStepUpProvider, FixedOtpProvider, OtpProvider, StepUpProvider } from './otp.js';
import { OtpRequestLimiter } from './otp-request-limiter.js';
import { OtpService } from './otp.service.js';
import { PasswordService } from './password.service.js';
import { SessionsService } from './sessions.service.js';

/** Sign-in, sessions and /v1/me. Owns the `credentials` and `sessions` tables. */
@Module({
  imports: [
    IdentityModule,
    UsersModule,
    // Per-IP limit on the public auth routes. In memory: fine for one instance; Redis later.
    ThrottlerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => [
        { name: 'auth', ttl: 60_000, limit: config.authRateLimitPerMinute },
      ],
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [
    PasswordService,
    CredentialsService,
    SessionsService,
    LoginFailureLimiter,
    OtpRequestLimiter,
    OtpService,
    { provide: AuthProvider, useClass: LocalAuthProvider },
    // Only "fixed" exists; loadAppConfig() rejects anything else and refuses it in production.
    { provide: OtpProvider, useClass: FixedOtpProvider },
    { provide: StepUpProvider, useClass: DisabledStepUpProvider },
  ],
})
export class AuthModule {}

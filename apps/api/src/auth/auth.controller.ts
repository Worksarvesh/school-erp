import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthenticatedGuard, CurrentIdentity } from './authenticated.guard.js';
import { LoginDto, PasswordResetDto, RefreshDto } from './auth.dto.js';
import { AuthProvider, type RequestMeta } from './auth-provider.js';
import type { Identity } from './identity.js';
import { OtpProvider } from './otp.js';

export const metaOf = (request: Request): RequestMeta => ({ ip: request.ip ?? null });

/** /v1/auth: public sign-in routes (rate-limited per IP) plus logout. */
@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthProvider,
    private readonly otp: OtpProvider,
  ) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto, @Req() request: Request) {
    return this.auth.login(body, metaOf(request));
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() body: RefreshDto, @Req() request: Request) {
    return this.auth.refresh(body.refreshToken, metaOf(request));
  }

  /** Needs OTP, which is not built yet: always 501 `not_enabled`, whatever the identifier. */
  @Post('password-reset')
  async passwordReset(@Body() body: PasswordResetDto): Promise<void> {
    await this.otp.send(body.identifier, 'password_reset');
  }

  /** Ends the session of the access token used for this call. */
  @Post('logout')
  @HttpCode(204)
  @ApiBearerAuth()
  @UseGuards(AuthenticatedGuard)
  async logout(@CurrentIdentity() identity: Identity, @Req() request: Request): Promise<void> {
    await this.auth.logout(identity, metaOf(request));
  }

  /** Ends every session of the user, on every device. */
  @Post('logout-all')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(AuthenticatedGuard)
  async logoutAll(@CurrentIdentity() identity: Identity, @Req() request: Request) {
    return { revoked: await this.auth.logoutAll(identity, metaOf(request)) };
  }
}

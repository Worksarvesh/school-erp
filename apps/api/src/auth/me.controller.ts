import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { TenancyService } from '../tenancy/tenancy.service.js';
import { UsersService } from '../users/users.service.js';
import { metaOf } from './auth.controller.js';
import { ChangePasswordDto } from './auth.dto.js';
import { AuthProvider } from './auth-provider.js';
import { AuthenticatedGuard, CurrentIdentity } from './authenticated.guard.js';
import type { Identity } from './identity.js';
import { SessionsService } from './sessions.service.js';
import { StepUpProvider } from './otp.js';

/** /v1/me: the signed-in user's profile, schools and devices. */
@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
@UseGuards(AuthenticatedGuard)
export class MeController {
  constructor(
    private readonly users: UsersService,
    private readonly tenancy: TenancyService,
    private readonly sessions: SessionsService,
    private readonly auth: AuthProvider,
    private readonly stepUp: StepUpProvider,
  ) {}

  @Get()
  async me(@CurrentIdentity() identity: Identity) {
    const profile = await this.users.getOwnProfile(identity.userId);
    if (!profile) {
      throw new NotFoundException();
    }
    return { ...profile, schools: await this.tenancy.listMySchools(identity.userId) };
  }

  @Get('sessions')
  async listSessions(@CurrentIdentity() identity: Identity) {
    const sessions = await this.sessions.listActive(identity.userId);
    return { items: sessions.map((s) => ({ ...s, current: s.id === identity.sessionId })) };
  }

  /** Signs one device out. 404 if the session is not the caller's (or already ended). */
  @Delete('sessions/:sessionId')
  @HttpCode(204)
  async revokeSession(
    @CurrentIdentity() identity: Identity,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Req() request: Request,
  ): Promise<void> {
    if (!(await this.auth.revokeSession(identity, sessionId, metaOf(request)))) {
      throw new NotFoundException();
    }
  }

  /** Needs step-up verification (OTP), not built yet: always 501 `not_enabled`. */
  @Post('password')
  @HttpCode(204)
  async changePassword(
    @CurrentIdentity() identity: Identity,
    @Body() _body: ChangePasswordDto,
  ): Promise<void> {
    await this.stepUp.require(identity.userId, 'password_change');
  }
}

import { Module } from '@nestjs/common';
import { IdentityModule } from '../auth/identity.module.js';
import { UsersModule } from '../users/users.module.js';
import { PlatformGuard } from './platform.guard.js';
import { PlatformStaffService } from './platform-staff.service.js';
import {
  MyVerificationRequestsController,
  PlatformSchoolsController,
  PlatformVerificationRequestsController,
} from './verification.controllers.js';
import { VerificationRequestsService } from './verification-requests.service.js';

/**
 * Company staff path and principal verification. Owns `platform_staff` and
 * `school_verification_requests`; reaches schools and memberships only through TenancyService.
 */
@Module({
  imports: [IdentityModule, UsersModule],
  controllers: [
    MyVerificationRequestsController,
    PlatformVerificationRequestsController,
    PlatformSchoolsController,
  ],
  providers: [PlatformStaffService, PlatformGuard, VerificationRequestsService],
})
export class PlatformModule {}

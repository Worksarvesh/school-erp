import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { MembersController } from './members.controller.js';
import { SchoolAccessGuard } from './school-access.guard.js';
import { SchoolProfileController } from './school-profile.controller.js';
import { TenancyService } from './tenancy.service.js';

/** Global so any module's @SchoolController can resolve SchoolAccessGuard and its dependencies. */
@Global()
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [SchoolProfileController, MembersController],
  providers: [TenancyService, SchoolAccessGuard],
  exports: [TenancyService, SchoolAccessGuard, AuthModule],
})
export class TenancyModule {}

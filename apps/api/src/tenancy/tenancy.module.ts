import { Global, Module } from '@nestjs/common';
import { IdentityModule } from '../auth/identity.module.js';
import { UsersModule } from '../users/users.module.js';
import { DirectoryController } from './directory.controller.js';
import { MembersController } from './members.controller.js';
import { SchoolAccessGuard } from './school-access.guard.js';
import { SchoolProfileController } from './school-profile.controller.js';
import { TenancyService } from './tenancy.service.js';

/** Global so any module's @SchoolController can resolve SchoolAccessGuard and its dependencies. */
@Global()
@Module({
  imports: [IdentityModule, UsersModule],
  controllers: [SchoolProfileController, MembersController, DirectoryController],
  providers: [TenancyService, SchoolAccessGuard],
  exports: [TenancyService, SchoolAccessGuard, IdentityModule],
})
export class TenancyModule {}

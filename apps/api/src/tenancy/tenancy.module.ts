import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SchoolAccessGuard } from './school-access.guard.js';
import { TenancyService } from './tenancy.service.js';

/** Global so any module's @SchoolController can resolve SchoolAccessGuard and its dependencies. */
@Global()
@Module({
  imports: [AuthModule],
  providers: [TenancyService, SchoolAccessGuard],
  exports: [TenancyService, SchoolAccessGuard, AuthModule],
})
export class TenancyModule {}

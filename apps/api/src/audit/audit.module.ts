import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';

/** Global: every module records sensitive actions. */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

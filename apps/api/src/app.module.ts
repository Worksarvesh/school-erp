import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from './config/app-config.js';
import { DatabaseModule } from './database/database.module.js';
import { PlatformModule } from './platform/platform.module.js';
import { TenancyModule } from './tenancy/tenancy.module.js';

@Module({
  imports: [ConfigModule, DatabaseModule, AuditModule, TenancyModule, AuthModule, PlatformModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

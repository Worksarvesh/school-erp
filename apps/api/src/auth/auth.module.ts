import { Module } from '@nestjs/common';
import { IdentityResolver, NoIdentityResolver } from './identity.js';

@Module({
  providers: [{ provide: IdentityResolver, useClass: NoIdentityResolver }],
  exports: [IdentityResolver],
})
export class AuthModule {}

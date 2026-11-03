import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { APP_CONFIG, type AppConfig, JWT_AUDIENCE, JWT_ISSUER } from '../config/app-config.js';
import { ACCESS_TOKEN_TTL_SECONDS, AccessTokenService } from './access-token.service.js';
import { AuthenticatedGuard } from './authenticated.guard.js';
import { IdentityResolver } from './identity.js';
import { JwtIdentityResolver } from './jwt-identity.resolver.js';

/** HS256 pinned on both sides; issuer and audience always set and always checked. */
export function jwtOptions(config: Pick<AppConfig, 'jwtAccessSecret'>): JwtModuleOptions {
  return {
    secret: config.jwtAccessSecret,
    signOptions: {
      algorithm: 'HS256',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
    verifyOptions: { algorithms: ['HS256'], issuer: JWT_ISSUER, audience: JWT_AUDIENCE },
  };
}

/** Token verification and "who is calling". Used by every guard; has no database access. */
@Module({
  imports: [JwtModule.registerAsync({ inject: [APP_CONFIG], useFactory: jwtOptions })],
  providers: [
    AccessTokenService,
    AuthenticatedGuard,
    { provide: IdentityResolver, useClass: JwtIdentityResolver },
  ],
  exports: [AccessTokenService, AuthenticatedGuard, IdentityResolver],
})
export class IdentityModule {}

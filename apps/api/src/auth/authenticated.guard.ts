import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { type Identity, IdentityResolver } from './identity.js';

type IdentityRequest = Request & { identity?: Identity };

/** For signed-in routes outside /v1/schools/:schoolId (school routes use SchoolAccessGuard). */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private readonly identity: IdentityResolver) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IdentityRequest>();
    const identity = await this.identity.resolve(request);
    if (!identity) {
      throw new UnauthorizedException();
    }
    request.identity = identity;
    return true;
  }
}

/** The caller checked by AuthenticatedGuard. */
export const CurrentIdentity = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Identity => {
    const identity = context.switchToHttp().getRequest<IdentityRequest>().identity;
    if (!identity) {
      throw new Error('CurrentIdentity used without AuthenticatedGuard');
    }
    return identity;
  },
);

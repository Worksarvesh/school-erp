import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { withUserContext } from '../database/school-context.js';
import { PasswordService } from './password.service.js';

/** The auth module owns the `credentials` table (password hashes). */
@Injectable()
export class CredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const credential = await withUserContext(this.prisma, userId, (tx) =>
      tx.credential.findUnique({ where: { userId }, select: { passwordHash: true } }),
    );
    return credential
      ? this.passwords.verify(credential.passwordHash, password)
      : this.passwords.verifyDummy(password);
  }
}

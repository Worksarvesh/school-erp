import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { withSchoolContext } from '../database/school-context.js';

/** The users module owns the `users` table; other modules read people through this service. */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Names of the given users, limited by RLS to members of `schoolId`. */
  async findNames(schoolId: string, userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) {
      return new Map();
    }
    const users = await withSchoolContext(this.prisma, schoolId, (tx) =>
      tx.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true } }),
    );
    return new Map(users.map((u) => [u.id, u.fullName]));
  }
}

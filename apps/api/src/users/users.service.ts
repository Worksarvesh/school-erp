import { Injectable } from '@nestjs/common';
import { uuidv7 } from '../common/uuid.js';
import { PrismaService } from '../database/prisma.service.js';
import { withSchoolContext, withUserContext } from '../database/school-context.js';
import type { UserStatus } from '../generated/prisma/enums.js';

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

  /**
   * Who signs in with this normalised phone/email? Exact match through the
   * auth_find_login_user() SECURITY DEFINER function (RLS hides users before login).
   */
  async findLoginUser(
    normalizedIdentifier: string,
  ): Promise<{ userId: string; status: UserStatus } | null> {
    const rows = await this.prisma.$queryRaw<{ user_id: string; status: UserStatus }[]>`
      SELECT user_id, status FROM auth_find_login_user(${normalizedIdentifier})`;
    const row = rows[0];
    return row ? { userId: row.user_id, status: row.status } : null;
  }

  /**
   * First OTP login of an unknown number (a principal registering): a user with only the verified
   * phone. The name is filled in with the verification request.
   */
  async createVerifiedPhoneUser(phone: string): Promise<string> {
    const id = uuidv7();
    const now = new Date();
    await withUserContext(this.prisma, id, (tx) =>
      tx.user.create({
        data: { id, fullName: '', phone, phoneVerifiedAt: now, lastLoginAt: now },
        select: { id: true },
      }),
    );
    return id;
  }

  /** After an OTP login: the phone is proven and the login time recorded. */
  async recordPhoneLogin(userId: string): Promise<void> {
    const now = new Date();
    await withUserContext(this.prisma, userId, (tx) =>
      tx.user.update({
        where: { id: userId },
        data: { phoneVerifiedAt: now, lastLoginAt: now },
        select: { id: true },
      }),
    );
  }

  /** The user's display name, set by the user (e.g. a principal's name on registration). */
  async setOwnName(userId: string, fullName: string): Promise<void> {
    await withUserContext(this.prisma, userId, (tx) =>
      tx.user.update({ where: { id: userId }, data: { fullName }, select: { id: true } }),
    );
  }

  /** The signed-in user's own profile. */
  getOwnProfile(userId: string) {
    return withUserContext(this.prisma, userId, (tx) =>
      tx.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, phone: true, email: true, status: true },
      }),
    );
  }
}

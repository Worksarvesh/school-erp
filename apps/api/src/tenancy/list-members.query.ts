import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { MembershipStatus, Role } from '../generated/prisma/enums.js';

/** Query string for GET /v1/schools/:schoolId/members (cursor pagination, filterable). */
export class ListMembersQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  /** `nextCursor` from the previous page. */
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;

  @IsOptional()
  @IsIn(Object.values(MembershipStatus))
  status?: MembershipStatus;
}

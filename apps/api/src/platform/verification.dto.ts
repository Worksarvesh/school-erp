import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { VerificationStatus } from '../generated/prisma/enums.js';

const PIN_CODE = /^[1-9][0-9]{5}$/;

/**
 * A principal's claim: either `schoolId` (picked from the directory) or the three "school not
 * listed" fields. The service rejects any other combination.
 */
export class SubmitVerificationRequestDto {
  @IsString()
  @Length(2, 100)
  principalName!: string;

  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  proposedName?: string;

  @IsOptional()
  @IsString()
  @Length(5, 500)
  proposedAddress?: string;

  @IsOptional()
  @Matches(PIN_CODE, { message: 'proposedPinCode must be a 6-digit PIN code' })
  proposedPinCode?: string;

  /** Resubmission: the caller's own rejected request. */
  @IsOptional()
  @IsUUID()
  previousRequestId?: string;
}

export class RejectVerificationRequestDto {
  @IsString()
  @Length(3, 1000)
  reason!: string;
}

export class ListVerificationRequestsQuery {
  @IsOptional()
  @IsIn(Object.values(VerificationStatus))
  status: VerificationStatus = 'pending';

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
}

export class AddDirectorySchoolDto {
  @IsString()
  @Length(2, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @IsOptional()
  @Matches(PIN_CODE, { message: 'pinCode must be a 6-digit PIN code' })
  pinCode?: string;

  @IsOptional()
  @IsString()
  @Length(5, 500)
  addressLine?: string;
}

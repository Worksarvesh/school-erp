import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './password.service.js';

export class LoginDto {
  /** Phone (Indian numbers may omit +91) or email. */
  @IsString()
  @Length(3, 254)
  identifier!: string;

  @IsString()
  @Length(1, PASSWORD_MAX_LENGTH)
  password!: string;

  /** Shown in the device list, e.g. "Pixel 8". */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;
}

export class RefreshDto {
  @IsString()
  @Length(1, 200)
  refreshToken!: string;
}

export class PasswordResetDto {
  @IsString()
  @Length(3, 254)
  identifier!: string;
}

export class ChangePasswordDto {
  @IsString()
  @Length(1, PASSWORD_MAX_LENGTH)
  currentPassword!: string;

  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  newPassword!: string;
}

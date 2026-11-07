import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { AuthenticatedGuard } from '../auth/authenticated.guard.js';
import { decodeDirectoryCursor, TenancyService } from './tenancy.service.js';

export class DirectorySearchQuery {
  /** Part of the school name, or a 6-digit PIN code. */
  @IsString()
  @Length(2, 100)
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;

  /** `nextCursor` from the previous page. */
  @IsOptional()
  @IsString()
  @Length(1, 400)
  cursor?: string;
}

/**
 * GET /v1/directory/schools: lets a signed-in principal find their school before they are a
 * member of it. Public directory fields only (name, code, city, PIN).
 */
@ApiTags('directory')
@ApiBearerAuth()
@Controller('directory/schools')
@UseGuards(AuthenticatedGuard)
export class DirectoryController {
  constructor(private readonly tenancy: TenancyService) {}

  @Get()
  search(@Query() query: DirectorySearchQuery) {
    const after = query.cursor ? decodeDirectoryCursor(query.cursor) : undefined;
    if (after === null) {
      throw new BadRequestException('Invalid cursor');
    }
    return this.tenancy.searchDirectory(query.q.trim(), query.limit, after);
  }
}

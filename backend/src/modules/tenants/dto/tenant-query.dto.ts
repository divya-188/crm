import { IsOptional, IsEnum, IsNumber, Min, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TenantStatus } from '../entities/tenant.entity';

export class TenantQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by status', enum: Object.values(TenantStatus) })
  @IsEnum(TenantStatus)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Search by name or slug' })
  @IsString()
  @IsOptional()
  search?: string;
}

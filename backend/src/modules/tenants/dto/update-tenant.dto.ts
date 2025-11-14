import { PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus, TenantStatusType } from '../entities/tenant.entity';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiPropertyOptional({ description: 'Tenant status', enum: Object.values(TenantStatus) })
  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatusType;
}

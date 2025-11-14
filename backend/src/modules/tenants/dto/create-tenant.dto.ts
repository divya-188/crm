import { IsString, IsOptional, IsObject, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus } from '../entities/tenant.entity';

export class CreateTenantDto {
  @ApiProperty({ description: 'Tenant name', example: 'Acme Corporation' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Tenant slug (auto-generated if not provided)', example: 'acme-corporation' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Custom domain', example: 'acme.example.com' })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiPropertyOptional({ description: 'Subscription plan ID' })
  @IsString()
  @IsOptional()
  subscriptionPlanId?: string;

  @ApiPropertyOptional({ description: 'Tenant settings', example: { timezone: 'UTC', language: 'en' } })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Tenant limits' })
  @IsObject()
  @IsOptional()
  limits?: {
    maxUsers?: number;
    maxContacts?: number;
    maxMessages?: number;
    maxWhatsAppConnections?: number;
  };
}

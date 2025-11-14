import { IsString, IsOptional, IsObject, IsNumber, IsDate, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(1)
  rateLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  rateLimitWindow?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

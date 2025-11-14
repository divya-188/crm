import { IsString, IsOptional, IsObject, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApiKeyDto {
  @IsString()
  name: string;

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
}

import { IsNumber, IsBoolean, IsArray, IsString, IsOptional, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class PasswordPolicyDto {
  @IsNumber()
  @Min(6)
  @Max(32)
  @IsOptional()
  minLength?: number;

  @IsBoolean()
  @IsOptional()
  requireUppercase?: boolean;

  @IsBoolean()
  @IsOptional()
  requireLowercase?: boolean;

  @IsBoolean()
  @IsOptional()
  requireNumbers?: boolean;

  @IsBoolean()
  @IsOptional()
  requireSpecialChars?: boolean;

  @IsNumber()
  @IsOptional()
  expiryDays?: number;

  @IsNumber()
  @IsOptional()
  preventReuse?: number;
}

class SessionManagementDto {
  @IsNumber()
  @IsOptional()
  maxSessions?: number;

  @IsNumber()
  @IsOptional()
  sessionTimeout?: number;

  @IsNumber()
  @IsOptional()
  idleTimeout?: number;

  @IsBoolean()
  @IsOptional()
  requireReauthForSensitive?: boolean;
}

class TwoFactorDto {
  @IsBoolean()
  @IsOptional()
  enforceForAdmins?: boolean;

  @IsBoolean()
  @IsOptional()
  enforceForAll?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedMethods?: string[];
}

class AuditLogDto {
  @IsNumber()
  @IsOptional()
  retentionDays?: number;

  @IsBoolean()
  @IsOptional()
  logFailedLogins?: boolean;

  @IsBoolean()
  @IsOptional()
  logPasswordChanges?: boolean;

  @IsBoolean()
  @IsOptional()
  logSettingsChanges?: boolean;
}

class IpWhitelistDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  addresses?: string[];
}

export class UpdateSecuritySettingsDto {
  @ValidateNested()
  @Type(() => PasswordPolicyDto)
  @IsOptional()
  passwordPolicy?: PasswordPolicyDto;

  @ValidateNested()
  @Type(() => SessionManagementDto)
  @IsOptional()
  sessionManagement?: SessionManagementDto;

  @ValidateNested()
  @Type(() => TwoFactorDto)
  @IsOptional()
  twoFactor?: TwoFactorDto;

  @ValidateNested()
  @Type(() => AuditLogDto)
  @IsOptional()
  auditLog?: AuditLogDto;

  @ValidateNested()
  @Type(() => IpWhitelistDto)
  @IsOptional()
  ipWhitelist?: IpWhitelistDto;
}

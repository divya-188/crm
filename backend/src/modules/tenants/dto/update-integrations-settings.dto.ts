import { IsOptional, IsBoolean, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OAuthProviderDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  clientSecret?: string;

  @IsString()
  @IsOptional()
  redirectUri?: string;
}

class OAuthSettingsDto {
  @ValidateNested()
  @Type(() => OAuthProviderDto)
  @IsOptional()
  google?: OAuthProviderDto;

  @ValidateNested()
  @Type(() => OAuthProviderDto)
  @IsOptional()
  microsoft?: OAuthProviderDto;
}

class ApiKeysSettingsDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsNumber()
  @IsOptional()
  maxKeys?: number;
}

class WebhooksSettingsDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsNumber()
  @IsOptional()
  maxWebhooks?: number;
}

class ThirdPartyIntegrationDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  webhookUrl?: string;
}

class ThirdPartySettingsDto {
  @ValidateNested()
  @Type(() => ThirdPartyIntegrationDto)
  @IsOptional()
  zapier?: ThirdPartyIntegrationDto;

  @ValidateNested()
  @Type(() => ThirdPartyIntegrationDto)
  @IsOptional()
  slack?: ThirdPartyIntegrationDto;
}

export class UpdateIntegrationsSettingsDto {
  @ValidateNested()
  @Type(() => OAuthSettingsDto)
  @IsOptional()
  oauth?: OAuthSettingsDto;

  @ValidateNested()
  @Type(() => ApiKeysSettingsDto)
  @IsOptional()
  apiKeys?: ApiKeysSettingsDto;

  @ValidateNested()
  @Type(() => WebhooksSettingsDto)
  @IsOptional()
  webhooks?: WebhooksSettingsDto;

  @ValidateNested()
  @Type(() => ThirdPartySettingsDto)
  @IsOptional()
  thirdParty?: ThirdPartySettingsDto;
}

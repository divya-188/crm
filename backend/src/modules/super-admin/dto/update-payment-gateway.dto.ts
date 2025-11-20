import { IsBoolean, IsString, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StripeConfigDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  publicKey?: string;

  @IsString()
  @IsOptional()
  secretKey?: string;

  @IsString()
  @IsOptional()
  webhookSecret?: string;
}

export class PayPalConfigDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  clientSecret?: string;

  @IsEnum(['sandbox', 'live'])
  @IsOptional()
  mode?: 'sandbox' | 'live';
}

export class RazorpayConfigDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  keyId?: string;

  @IsString()
  @IsOptional()
  keySecret?: string;

  @IsString()
  @IsOptional()
  webhookSecret?: string;
}

export class UpdatePaymentGatewayDto {
  @ValidateNested()
  @Type(() => StripeConfigDto)
  @IsOptional()
  stripe?: StripeConfigDto;

  @ValidateNested()
  @Type(() => PayPalConfigDto)
  @IsOptional()
  paypal?: PayPalConfigDto;

  @ValidateNested()
  @Type(() => RazorpayConfigDto)
  @IsOptional()
  razorpay?: RazorpayConfigDto;
}

export class TestConnectionDto {
  @IsEnum(['stripe', 'paypal', 'razorpay'])
  provider: 'stripe' | 'paypal' | 'razorpay';

  @IsOptional()
  credentials?: any;
}

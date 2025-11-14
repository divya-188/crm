import { IsString, IsEnum, IsOptional } from 'class-validator';
import { PaymentProvider } from './create-subscription.dto';

export class UpgradeSubscriptionDto {
  @IsString()
  newPlanId: string;

  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

export class DowngradeSubscriptionDto {
  @IsString()
  newPlanId: string;
}

export class ApplyCouponDto {
  @IsString()
  couponCode: string;
}

export class RenewSubscriptionDto {
  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

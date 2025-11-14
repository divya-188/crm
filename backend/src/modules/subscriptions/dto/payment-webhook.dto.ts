import { IsString, IsEnum, IsObject, IsOptional } from 'class-validator';
import { PaymentProvider } from './create-subscription.dto';

export class PaymentWebhookDto {
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsString()
  eventType: string;

  @IsObject()
  data: any;

  @IsString()
  @IsOptional()
  signature?: string;
}

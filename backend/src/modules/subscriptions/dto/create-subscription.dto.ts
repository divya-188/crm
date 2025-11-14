import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  RAZORPAY = 'razorpay',
}

export class CreateSubscriptionDto {
  @IsString()
  planId: string;

  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;

  @IsString()
  @IsOptional()
  paymentMethodId?: string; // For Stripe

  @IsString()
  @IsOptional()
  paymentToken?: string; // For PayPal/Razorpay

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

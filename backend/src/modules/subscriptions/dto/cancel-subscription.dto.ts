import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CancelSubscriptionDto {
  @IsString()
  @IsOptional()
  cancellationReason?: string;

  @IsBoolean()
  @IsOptional()
  cancelImmediately?: boolean; // If true, cancel immediately; if false, cancel at period end
}

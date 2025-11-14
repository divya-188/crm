import { IsString, IsNumber, IsBoolean, IsOptional, IsObject, ValidateNested, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class PlanFeaturesDto {
  @IsNumber()
  @Min(0)
  maxContacts: number;

  @IsNumber()
  @Min(0)
  maxUsers: number;

  @IsNumber()
  @Min(0)
  maxConversations: number;

  @IsNumber()
  @Min(0)
  maxCampaigns: number;

  @IsNumber()
  @Min(0)
  maxFlows: number;

  @IsNumber()
  @Min(0)
  maxAutomations: number;

  @IsNumber()
  @Min(0)
  whatsappConnections: number;

  @IsBoolean()
  apiAccess: boolean;

  @IsBoolean()
  customBranding: boolean;

  @IsBoolean()
  prioritySupport: boolean;
}

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsIn(['monthly', 'quarterly', 'annual'])
  billingCycle: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PlanFeaturesDto)
  features: PlanFeaturesDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

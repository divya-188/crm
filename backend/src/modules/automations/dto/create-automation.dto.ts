import { IsString, IsOptional, IsArray, IsEnum, IsObject } from 'class-validator';
import { TriggerType, ActionType } from '../entities/automation.entity';

export class CreateAutomationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TriggerType)
  triggerType: string;

  @IsOptional()
  @IsObject()
  triggerConfig?: Record<string, any>;

  @IsOptional()
  @IsArray()
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;

  @IsArray()
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;

  @IsOptional()
  @IsString()
  status?: string;
}

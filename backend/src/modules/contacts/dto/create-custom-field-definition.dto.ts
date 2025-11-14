import { IsString, IsEnum, IsBoolean, IsOptional, IsArray, IsNumber, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomFieldType } from '../entities/custom-field-definition.entity';

export class CreateCustomFieldDefinitionDto {
  @ApiProperty({ description: 'Unique key for the custom field (snake_case)', example: 'customer_type' })
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9_]+$/, { message: 'Key must be lowercase alphanumeric with underscores only' })
  key: string;

  @ApiProperty({ description: 'Display label for the field', example: 'Customer Type' })
  @IsString()
  @MaxLength(100)
  label: string;

  @ApiProperty({ 
    description: 'Field type', 
    enum: CustomFieldType,
    example: CustomFieldType.TEXT 
  })
  @IsEnum(CustomFieldType)
  type: CustomFieldType;

  @ApiPropertyOptional({ 
    description: 'Options for dropdown type', 
    type: [String],
    example: ['VIP', 'Regular', 'New'] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Whether the field is required', default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Default value for the field' })
  @IsOptional()
  @IsString()
  defaultValue?: string;

  @ApiPropertyOptional({ description: 'Placeholder text' })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiPropertyOptional({ description: 'Help text to display' })
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiPropertyOptional({ description: 'Sort order for display', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

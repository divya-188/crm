import { IsString, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TemplateCategory, TemplateLanguage } from '../entities/template.entity';

class TemplateVariableDto {
  @ApiProperty({ example: 'customer_name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  example: string;
}

class TemplateButtonDto {
  @ApiProperty({ example: 'url' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Visit Website' })
  @IsString()
  text: string;

  @ApiProperty({ example: 'https://example.com', required: false })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'welcome_message' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'marketing', enum: Object.values(TemplateCategory) })
  @IsEnum(TemplateCategory)
  category: string;

  @ApiProperty({ example: 'en', enum: Object.values(TemplateLanguage) })
  @IsEnum(TemplateLanguage)
  language: string;

  @ApiProperty({ example: 'Hello {{1}}, welcome to our service!' })
  @IsString()
  content: string;

  @ApiProperty({ type: [TemplateVariableDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateVariableDto)
  variables?: TemplateVariableDto[];

  @ApiProperty({ type: [TemplateButtonDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  buttons?: TemplateButtonDto[];

  @ApiProperty({ example: 'Welcome Message', required: false })
  @IsOptional()
  @IsString()
  header?: string;

  @ApiProperty({ example: 'Thank you for choosing us', required: false })
  @IsOptional()
  @IsString()
  footer?: string;
}

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

class TemplateComponentsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  header?: {
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
    text?: string;
    mediaUrl?: string;
    mediaHandle?: string;
  };

  @ApiProperty({ required: true })
  body: {
    text: string;
    placeholders: Array<{
      index: number;
      example: string;
    }>;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  footer?: {
    text: string;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'welcome_message' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Welcome Message', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ example: 'marketing', enum: Object.values(TemplateCategory) })
  @IsEnum(TemplateCategory)
  category: string;

  @ApiProperty({ example: 'en', enum: Object.values(TemplateLanguage) })
  @IsEnum(TemplateLanguage)
  language: string;

  @ApiProperty({ example: 'A welcome message template', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  // Legacy field for backward compatibility
  @ApiProperty({ example: 'Hello {{1}}, welcome to our service!', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  // New structured components field
  @ApiProperty({ required: false })
  @IsOptional()
  components?: {
    header?: {
      type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
      text?: string;
      mediaUrl?: string;
      mediaHandle?: string;
    };
    body: {
      text: string;
      placeholders: Array<{
        index: number;
        example: string;
      }>;
    };
    footer?: {
      text: string;
    };
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
      text: string;
      url?: string;
      phoneNumber?: string;
    }>;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  sampleValues?: Record<string, string>;

  // Legacy fields for backward compatibility
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

import { IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTemplateDto } from './create-template.dto';

export class ImportTemplateDto {
  @ApiProperty({
    description: 'Array of templates to import',
    type: [CreateTemplateDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateDto)
  templates: CreateTemplateDto[];

  @ApiProperty({
    description: 'Whether to skip templates with duplicate names',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;

  @ApiProperty({
    description: 'Whether to create new versions for existing templates instead of skipping',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  createVersions?: boolean;

  @ApiProperty({
    description: 'Prefix to add to all imported template names to avoid conflicts',
    required: false,
  })
  @IsOptional()
  namePrefix?: string;
}

export class ExportTemplatesDto {
  @ApiProperty({
    description: 'Array of template IDs to export. If not provided, exports all templates.',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  templateIds?: string[];

  @ApiProperty({
    description: 'Whether to include archived templates in export',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean;

  @ApiProperty({
    description: 'Whether to include template analytics in export',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeAnalytics?: boolean;

  @ApiProperty({
    description: 'Whether to include status history in export',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeHistory?: boolean;
}

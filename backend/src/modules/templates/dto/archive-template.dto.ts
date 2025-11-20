import { IsString, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for archiving a single template
 * Requirement 14.5: Add archive reason tracking
 */
export class ArchiveTemplateDto {
  @ApiPropertyOptional({
    description: 'Reason for archiving the template',
    example: 'Template no longer needed for current campaigns',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

/**
 * DTO for bulk archiving templates
 * Requirement 14.5: Bulk archive operations
 */
export class BulkArchiveTemplatesDto {
  @ApiProperty({
    description: 'Array of template IDs to archive',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one template ID is required' })
  @IsString({ each: true })
  templateIds: string[];

  @ApiPropertyOptional({
    description: 'Reason for archiving the templates',
    example: 'End of season campaign cleanup',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

/**
 * DTO for bulk restoring templates
 * Requirement 14.5: Bulk restore operations
 */
export class BulkRestoreTemplatesDto {
  @ApiProperty({
    description: 'Array of template IDs to restore',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one template ID is required' })
  @IsString({ each: true })
  templateIds: string[];
}

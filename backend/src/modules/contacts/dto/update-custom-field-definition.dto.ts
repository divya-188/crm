import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCustomFieldDefinitionDto } from './create-custom-field-definition.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomFieldDefinitionDto extends PartialType(
  OmitType(CreateCustomFieldDefinitionDto, ['key'] as const)
) {
  @ApiPropertyOptional({ description: 'Whether the field is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

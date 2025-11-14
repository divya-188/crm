import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSegmentDto {
  @ApiProperty({ description: 'Segment name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Segment description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Segment filter criteria' })
  @IsObject()
  @IsNotEmpty()
  criteria: SegmentCriteria;
}

export interface SegmentCriteria {
  logic: 'AND' | 'OR';
  conditions: SegmentCondition[];
}

export interface SegmentCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

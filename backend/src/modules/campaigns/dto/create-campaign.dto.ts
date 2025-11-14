import { IsString, IsUUID, IsObject, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Sale Campaign' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'uuid-of-template' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ example: { tags: ['customer'], customFields: {} } })
  @IsObject()
  segmentCriteria: Record<string, any>;

  @ApiProperty({ 
    example: { customer_name: 'firstName', discount: '20%' },
    required: false 
  })
  @IsOptional()
  @IsObject()
  variableMapping?: Record<string, string>;

  @ApiProperty({ example: '2024-12-25T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

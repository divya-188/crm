import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ example: 'uuid-of-contact' })
  @IsUUID()
  contactId: string;

  @ApiProperty({ example: 'uuid-of-user', required: false })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiProperty({ example: ['support', 'urgent'], required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ example: 'Internal notes about this conversation', required: false })
  @IsOptional()
  @IsString()
  internalNotes?: string;
}

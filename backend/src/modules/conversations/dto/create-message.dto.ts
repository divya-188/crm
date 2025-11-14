import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType, MessageDirection } from '../entities/message.entity';

export class CreateMessageDto {
  @ApiProperty({ example: 'text', enum: Object.values(MessageType) })
  @IsEnum(MessageType)
  type: string;

  @ApiProperty({ example: 'outbound', enum: Object.values(MessageDirection) })
  @IsEnum(MessageDirection)
  direction: string;

  @ApiProperty({ example: 'Hello, how can I help you?' })
  @IsString()
  content: string;

  @ApiProperty({ 
    example: { mediaUrl: 'https://example.com/image.jpg', mimeType: 'image/jpeg' },
    required: false 
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestWebhookDto {
  @ApiProperty({ description: 'Event type to test', example: 'message.new' })
  @IsString()
  eventType: string;

  @ApiPropertyOptional({ description: 'Sample payload for testing', example: { message: 'Test message' } })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

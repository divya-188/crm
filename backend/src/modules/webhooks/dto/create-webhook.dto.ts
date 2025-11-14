import { IsString, IsUrl, IsArray, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook name', example: 'New Message Webhook' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Webhook URL', example: 'https://example.com/webhook' })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: 'Events to subscribe to',
    example: ['message.new', 'conversation.created', 'campaign.completed'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional({ description: 'Secret for signature verification' })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional({ description: 'Number of retry attempts', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  retryCount?: number;

  @ApiPropertyOptional({ description: 'Timeout in seconds', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  timeoutSeconds?: number;

  @ApiPropertyOptional({ description: 'Whether webhook is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

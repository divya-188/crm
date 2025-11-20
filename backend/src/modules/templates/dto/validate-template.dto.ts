import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTemplateDto {
  @ApiProperty({ 
    example: 'order_confirmation_v1',
    description: 'Template name (lowercase with underscores only)',
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 'TRANSACTIONAL',
    enum: ['TRANSACTIONAL', 'UTILITY', 'MARKETING', 'ACCOUNT_UPDATE', 'OTP'],
    description: 'Template category',
  })
  @IsEnum(['TRANSACTIONAL', 'UTILITY', 'MARKETING', 'ACCOUNT_UPDATE', 'OTP'])
  category: string;

  @ApiProperty({ 
    example: 'en_US',
    description: 'Template language code (e.g., en_US, hi_IN)',
  })
  @IsString()
  language: string;

  @ApiProperty({ 
    example: 'Order confirmation template',
    required: false,
    description: 'Template description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Template components (header, body, footer, buttons)',
    example: {
      header: {
        type: 'TEXT',
        text: 'Order Confirmation',
      },
      body: {
        text: 'Hi {{1}}, your order {{2}} has been confirmed!',
        placeholders: [
          { index: 1, example: 'John' },
          { index: 2, example: '#12345' },
        ],
      },
      footer: {
        text: 'Thank you for your order',
      },
      buttons: [
        {
          type: 'URL',
          text: 'Track Order',
          url: 'https://example.com/track/{{1}}',
        },
      ],
    },
  })
  @IsObject()
  components: {
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

  @ApiProperty({
    description: 'Sample values for placeholders',
    example: {
      '1': 'John Doe',
      '2': 'Order #12345',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  sampleValues?: Record<string, string>;
}

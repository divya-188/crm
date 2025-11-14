import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  notifications?: {
    email?: boolean;
    push?: boolean;
    newMessage?: boolean;
    newConversation?: boolean;
    assignedConversation?: boolean;
    mentionedInNote?: boolean;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}

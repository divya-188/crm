import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConnectionType } from '../entities/whatsapp-connection.entity';

export class CreateConnectionDto {
  @ApiProperty({ example: 'My WhatsApp Business' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'meta_api', enum: Object.values(ConnectionType) })
  @IsEnum(ConnectionType)
  type: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: '123456789', required: false })
  @IsOptional()
  @IsString()
  phoneNumberId?: string;

  @ApiProperty({ example: '987654321', required: false })
  @IsOptional()
  @IsString()
  businessAccountId?: string;

  @ApiProperty({ example: 'EAAxxxxx', required: false })
  @IsOptional()
  @IsString()
  accessToken?: string;
}

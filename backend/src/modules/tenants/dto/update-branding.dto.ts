import { IsString, IsOptional, IsUrl, IsHexColor } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBrandingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fontFamily?: string;
}

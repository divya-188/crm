import { IsString, IsOptional, IsUrl, IsHexColor, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ColorsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  primary?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  secondary?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  accent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  background?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  text?: string;
}

class TypographyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  headingFont?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  fontSize?: Record<string, string>;
}

export class UpdateTenantBrandingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @ApiProperty({ required: false, type: ColorsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ColorsDto)
  colors?: ColorsDto;

  @ApiProperty({ required: false, type: TypographyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TypographyDto)
  typography?: TypographyDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customCss?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tagline?: string;
}

import { IsString, IsOptional, ValidateNested, IsHexColor } from 'class-validator';
import { Type } from 'class-transformer';

class ColorsDto {
  @IsHexColor()
  @IsOptional()
  primary?: string;

  @IsHexColor()
  @IsOptional()
  secondary?: string;

  @IsHexColor()
  @IsOptional()
  accent?: string;

  @IsHexColor()
  @IsOptional()
  background?: string;

  @IsHexColor()
  @IsOptional()
  text?: string;
}

class FontsDto {
  @IsString()
  @IsOptional()
  heading?: string;

  @IsString()
  @IsOptional()
  body?: string;
}

export class UpdateBrandingDto {
  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  favicon?: string;

  @ValidateNested()
  @Type(() => ColorsDto)
  @IsOptional()
  colors?: ColorsDto;

  @ValidateNested()
  @Type(() => FontsDto)
  @IsOptional()
  fonts?: FontsDto;

  @IsString()
  @IsOptional()
  customCSS?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  tagline?: string;
}

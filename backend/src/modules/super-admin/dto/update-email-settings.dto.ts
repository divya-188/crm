import { IsString, IsNumber, IsBoolean, IsEnum, IsOptional, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

class SMTPAuthDto {
  @IsString()
  user: string;

  @IsString()
  pass: string;
}

class SMTPConfigDto {
  @IsString()
  host: string;

  @IsNumber()
  port: number;

  @IsBoolean()
  secure: boolean;

  @ValidateNested()
  @Type(() => SMTPAuthDto)
  auth: SMTPAuthDto;
}

class SendGridConfigDto {
  @IsString()
  apiKey: string;
}

class MailgunConfigDto {
  @IsString()
  apiKey: string;

  @IsString()
  domain: string;
}

class EmailFromDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}

export class UpdateEmailSettingsDto {
  @IsEnum(['smtp', 'sendgrid', 'mailgun'])
  @IsOptional()
  provider?: 'smtp' | 'sendgrid' | 'mailgun';

  @ValidateNested()
  @Type(() => SMTPConfigDto)
  @IsOptional()
  smtp?: SMTPConfigDto;

  @ValidateNested()
  @Type(() => SendGridConfigDto)
  @IsOptional()
  sendgrid?: SendGridConfigDto;

  @ValidateNested()
  @Type(() => MailgunConfigDto)
  @IsOptional()
  mailgun?: MailgunConfigDto;

  @ValidateNested()
  @Type(() => EmailFromDto)
  @IsOptional()
  from?: EmailFromDto;
}

export class SendTestEmailDto {
  @IsEmail()
  to: string;
}

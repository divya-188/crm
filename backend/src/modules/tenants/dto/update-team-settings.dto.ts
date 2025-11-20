import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class DefaultSettingsDto {
  @ApiProperty({ required: false, enum: ['agent', 'user'] })
  @IsOptional()
  @IsEnum(['agent', 'user'])
  defaultUserRole?: 'agent' | 'user';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoAssignConversations?: boolean;

  @ApiProperty({ required: false, enum: ['round_robin', 'load_balanced', 'manual'] })
  @IsOptional()
  @IsEnum(['round_robin', 'load_balanced', 'manual'])
  assignmentStrategy?: 'round_robin' | 'load_balanced' | 'manual';
}

class InvitationSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowSelfRegistration?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  approvedEmailDomains?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requireAdminApproval?: boolean;
}

class DepartmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}

export class UpdateTeamSettingsDto {
  @ApiProperty({ required: false, type: DefaultSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DefaultSettingsDto)
  defaultSettings?: DefaultSettingsDto;

  @ApiProperty({ required: false, type: InvitationSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvitationSettingsDto)
  invitationSettings?: InvitationSettingsDto;

  @ApiProperty({ required: false, type: [DepartmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentDto)
  departments?: DepartmentDto[];
}

export class CreateDepartmentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDepartmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}

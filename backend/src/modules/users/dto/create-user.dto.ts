import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: ['super_admin', 'admin', 'agent', 'user'], example: 'agent' })
  @IsEnum(UserRole)
  role: 'super_admin' | 'admin' | 'agent' | 'user';

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'team-uuid' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'suspended'], example: 'active' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: 'active' | 'inactive' | 'suspended';
}

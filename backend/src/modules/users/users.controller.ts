import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuotaGuard } from '../subscriptions/guards/quota.guard';
import { QuotaResource } from '../subscriptions/decorators/quota.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({ status: 200, description: 'List of users retrieved' })
  findAll(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    // Pass tenantId from authenticated user
    // Super admins (no tenantId) will see all users
    // Regular admins will only see users from their tenant
    return this.usersService.findAll({ 
      page, 
      limit, 
      role, 
      status, 
      search,
      tenantId: req.user.tenantId 
    });
  }

  @Post()
  @UseGuards(QuotaGuard)
  @QuotaResource('users')
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Quota limit exceeded' })
  create(@Request() req: any, @Body() createUserDto: CreateUserDto): Promise<User> {
    // Automatically assign the tenantId from the authenticated user
    // This ensures users can only create users within their own tenant
    const userData = {
      ...createUserDto,
      tenantId: req.user.tenantId,
    };
    return this.usersService.create(userData);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateData: Partial<User>): Promise<User> {
    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot delete this user' })
  remove(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.remove(req.user.userId, id);
  }

  @Get('me/profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  getProfile(@Request() req): Promise<User> {
    return this.usersService.findOne(req.user.userId);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto): Promise<User> {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const success = await this.usersService.changePassword(
      req.user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    
    if (!success) {
      throw new BadRequestException('Current password is incorrect');
    }
    
    return { message: 'Password changed successfully' };
  }

  @Get('me/settings')
  @ApiOperation({ summary: 'Get current user settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  async getSettings(@Request() req): Promise<any> {
    const user = await this.usersService.findOne(req.user.userId);
    return user.settings || {};
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Update current user settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  updateSettings(@Request() req, @Body() updateSettingsDto: UpdateSettingsDto): Promise<User> {
    return this.usersService.updateSettings(req.user.userId, updateSettingsDto);
  }
}

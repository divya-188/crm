import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantQueryDto } from './dto/tenant-query.dto';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'Tenant slug already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all tenants with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of tenants retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  findAll(@Query() query: TenantQueryDto) {
    return this.tenantsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get tenant statistics' })
  @ApiResponse({ status: 200, description: 'Tenant stats retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  getStats(@Param('id') id: string) {
    return this.tenantsService.getStats(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Tenant slug already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tenant status' })
  @ApiResponse({ status: 200, description: 'Tenant status updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  updateStatus(@Param('id') id: string, @Body('status') status: string): Promise<Tenant> {
    return this.tenantsService.updateStatus(id, status);
  }

  @Patch(':id/settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tenant settings' })
  @ApiResponse({ status: 200, description: 'Tenant settings updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  updateSettings(@Param('id') id: string, @Body() settings: Record<string, any>): Promise<Tenant> {
    return this.tenantsService.updateSettings(id, settings);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  remove(@Param('id') id: string): Promise<void> {
    return this.tenantsService.remove(id);
  }

  @Get('me/business-profile')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get current tenant business profile' })
  @ApiResponse({ status: 200, description: 'Business profile retrieved' })
  async getBusinessProfile(@Request() req: any): Promise<any> {
    const tenant = await this.tenantsService.findOne(req.user.tenantId);
    return tenant.settings?.businessProfile || {};
  }

  @Patch('me/business-profile')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update current tenant business profile' })
  @ApiResponse({ status: 200, description: 'Business profile updated' })
  updateBusinessProfile(@Request() req: any, @Body() updateBusinessProfileDto: UpdateBusinessProfileDto): Promise<Tenant> {
    return this.tenantsService.updateBusinessProfile(req.user.tenantId, updateBusinessProfileDto);
  }

  @Get('me/branding')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get current tenant branding' })
  @ApiResponse({ status: 200, description: 'Branding retrieved' })
  async getBranding(@Request() req: any): Promise<any> {
    const tenant = await this.tenantsService.findOne(req.user.tenantId);
    return tenant.settings?.branding || {};
  }

  @Patch('me/branding')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update current tenant branding' })
  @ApiResponse({ status: 200, description: 'Branding updated' })
  updateBranding(@Request() req: any, @Body() updateBrandingDto: UpdateBrandingDto): Promise<Tenant> {
    return this.tenantsService.updateBranding(req.user.tenantId, updateBrandingDto);
  }
}

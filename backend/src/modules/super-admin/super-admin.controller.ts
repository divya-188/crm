import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SuperAdminService } from './super-admin.service';

@ApiTags('Super Admin')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get platform-wide statistics' })
  @ApiResponse({ status: 200, description: 'Platform stats retrieved successfully' })
  async getPlatformStats() {
    return this.superAdminService.getPlatformStats();
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Tenants retrieved successfully' })
  async getAllTenants(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    return this.superAdminService.getAllTenants({ page, limit, status });
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get tenant details' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  async getTenant(@Param('id') id: string) {
    return this.superAdminService.getTenantDetails(id);
  }

  @Put('tenants/:id/status')
  @ApiOperation({ summary: 'Update tenant status' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Tenant status updated successfully' })
  async updateTenantStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.superAdminService.updateTenantStatus(id, body.status);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users across all tenants' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('role') role?: string,
  ) {
    return this.superAdminService.getAllUsers({ page, limit, role });
  }

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get platform analytics overview' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalyticsOverview() {
    return this.superAdminService.getAnalyticsOverview();
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiQuery({ name: 'period', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  async getRevenueAnalytics(@Query('period') period: string = '30d') {
    return this.superAdminService.getRevenueAnalytics(period);
  }

  @Post('tenants/:id/impersonate')
  @ApiOperation({ summary: 'Impersonate tenant admin for support' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Impersonation token generated' })
  async impersonateTenant(@Param('id') id: string) {
    return this.superAdminService.impersonateTenant(id);
  }
}

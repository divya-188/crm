import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TeamSettingsService, TeamSettings } from '../services/team-settings.service';
import {
  UpdateTeamSettingsDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '../dto/update-team-settings.dto';

@ApiTags('Team Settings')
@Controller('tenants/settings/team')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeamSettingsController {
  constructor(private readonly teamSettingsService: TeamSettingsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get team settings' })
  @ApiResponse({ status: 200, description: 'Team settings retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getSettings(@Request() req): Promise<TeamSettings> {
    return this.teamSettingsService.getSettings(req.user.tenantId);
  }

  @Put()
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update team settings' })
  @ApiResponse({ status: 200, description: 'Team settings updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateSettings(
    @Request() req,
    @Body() updateDto: UpdateTeamSettingsDto,
  ): Promise<TeamSettings> {
    return this.teamSettingsService.updateSettings(
      req.user.tenantId,
      updateDto as any,
      req.user.id,
    );
  }

  @Get('default-role')
  @Roles('admin')
  @ApiOperation({ summary: 'Get default user role' })
  @ApiResponse({ status: 200, description: 'Default role retrieved' })
  async getDefaultRole(@Request() req): Promise<{ role: 'agent' | 'user' }> {
    const role = await this.teamSettingsService.getDefaultUserRole(req.user.tenantId);
    return { role };
  }

  @Get('assignment-strategy')
  @Roles('admin')
  @ApiOperation({ summary: 'Get assignment strategy' })
  @ApiResponse({ status: 200, description: 'Assignment strategy retrieved' })
  async getAssignmentStrategy(
    @Request() req,
  ): Promise<{ strategy: 'round_robin' | 'load_balanced' | 'manual' }> {
    const strategy = await this.teamSettingsService.getAssignmentStrategy(
      req.user.tenantId,
    );
    return { strategy };
  }

  @Post('departments')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  async createDepartment(
    @Request() req,
    @Body() createDto: CreateDepartmentDto,
  ): Promise<TeamSettings> {
    return this.teamSettingsService.addDepartment(
      req.user.tenantId,
      createDto,
      req.user.id,
    );
  }

  @Put('departments/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async updateDepartment(
    @Request() req,
    @Param('id') departmentId: string,
    @Body() updateDto: UpdateDepartmentDto,
  ): Promise<TeamSettings> {
    return this.teamSettingsService.updateDepartment(
      req.user.tenantId,
      departmentId,
      updateDto,
      req.user.id,
    );
  }

  @Delete('departments/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponse({ status: 200, description: 'Department deleted successfully' })
  async deleteDepartment(
    @Request() req,
    @Param('id') departmentId: string,
  ): Promise<TeamSettings> {
    return this.teamSettingsService.deleteDepartment(
      req.user.tenantId,
      departmentId,
      req.user.id,
    );
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { QuotaGuard } from '../subscriptions/guards/quota.guard';
import { QuotaResource } from '../subscriptions/decorators/quota.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AutomationsService } from './automations.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';

@ApiTags('Automations')
@ApiBearerAuth()
@Controller('automations')
@UseGuards(JwtAuthGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Post()
  @UseGuards(QuotaGuard)
  @QuotaResource('automations')
  @ApiOperation({ summary: 'Create a new automation rule' })
  @ApiResponse({ status: 201, description: 'Automation created successfully' })
  @ApiResponse({ status: 403, description: 'Quota limit exceeded' })
  create(
    @CurrentUser() user: any,
    @Body() createAutomationDto: CreateAutomationDto,
  ) {
    return this.automationsService.create(user.tenantId, createAutomationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all automations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Automations retrieved successfully' })
  findAll(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    return this.automationsService.findAll(user.tenantId, {
      page,
      limit,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get automation by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Automation retrieved successfully' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automationsService.findOne(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update automation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Automation updated successfully' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateAutomationDto: UpdateAutomationDto,
  ) {
    return this.automationsService.update(
      id,
      user.tenantId,
      updateAutomationDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete automation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Automation deleted successfully' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automationsService.remove(id, user.tenantId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate automation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Automation activated successfully' })
  activate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automationsService.updateStatus(id, user.tenantId, 'active');
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate automation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Automation deactivated successfully' })
  deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automationsService.updateStatus(id, user.tenantId, 'inactive');
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Get automation execution history' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Executions retrieved successfully' })
  getExecutions(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.automationsService.getExecutions(id, user.tenantId, {
      page,
      limit,
    });
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate automation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Automation duplicated successfully' })
  duplicate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automationsService.duplicate(id, user.tenantId);
  }
}

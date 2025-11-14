import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuotaGuard } from '../subscriptions/guards/quota.guard';
import { QuotaResource } from '../subscriptions/decorators/quota.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @UseGuards(QuotaGuard)
  @QuotaResource('campaigns')
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  @ApiResponse({ status: 403, description: 'Quota limit exceeded' })
  create(@TenantId() tenantId: string, @Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignsService.create(tenantId, createCampaignDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns with pagination' })
  @ApiResponse({ status: 200, description: 'List of campaigns retrieved' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.campaignsService.findAll(tenantId, page, limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCampaignDto>,
  ) {
    return this.campaignsService.update(tenantId, id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.remove(tenantId, id);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule campaign' })
  @ApiResponse({ status: 200, description: 'Campaign scheduled' })
  schedule(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('scheduledAt') scheduledAt: string,
  ) {
    return this.campaignsService.schedule(tenantId, id, new Date(scheduledAt));
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start campaign' })
  @ApiResponse({ status: 200, description: 'Campaign started' })
  start(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.start(tenantId, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause campaign' })
  @ApiResponse({ status: 200, description: 'Campaign paused' })
  pause(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.pause(tenantId, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume campaign' })
  @ApiResponse({ status: 200, description: 'Campaign resumed' })
  resume(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.resume(tenantId, id);
  }

  @Get(':id/recipients')
  @ApiOperation({ summary: 'Get campaign recipients' })
  @ApiResponse({ status: 200, description: 'Recipients retrieved' })
  getRecipients(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.getRecipients(tenantId, id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getStats(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.getStats(tenantId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate campaign' })
  @ApiResponse({ status: 201, description: 'Campaign duplicated' })
  duplicate(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.duplicate(tenantId, id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get campaign messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMessages(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.campaignsService.getMessages(tenantId, id, page, limit);
  }
}

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved' })
  getDashboard(@CurrentUser() user: any) {
    return this.analyticsService.getDashboardMetrics(user.tenantId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversation analytics' })
  @ApiQuery({ name: 'start', required: false, type: String })
  @ApiQuery({ name: 'end', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Conversation analytics retrieved' })
  getConversationAnalytics(
    @CurrentUser() user: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    return this.analyticsService.getConversationAnalytics(
      user.tenantId,
      startDate,
      endDate,
    );
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get message volume analytics' })
  @ApiQuery({ name: 'start', required: false, type: String })
  @ApiQuery({ name: 'end', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Message analytics retrieved' })
  getMessageAnalytics(
    @CurrentUser() user: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    return this.analyticsService.getMessageVolumeAnalytics(
      user.tenantId,
      startDate,
      endDate,
    );
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get campaign performance analytics' })
  @ApiResponse({ status: 200, description: 'Campaign analytics retrieved' })
  getCampaignPerformance(@CurrentUser() user: any) {
    return this.analyticsService.getCampaignPerformance(user.tenantId);
  }

  @Get('flows')
  @ApiOperation({ summary: 'Get flow performance analytics' })
  @ApiResponse({ status: 200, description: 'Flow analytics retrieved' })
  getFlowPerformance(@CurrentUser() user: any) {
    return this.analyticsService.getFlowPerformance(user.tenantId);
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get agent performance analytics' })
  @ApiQuery({ name: 'start', required: false, type: String })
  @ApiQuery({ name: 'end', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Agent analytics retrieved' })
  getAgentPerformance(
    @CurrentUser() user: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    return this.analyticsService.getAgentPerformance(user.tenantId, startDate, endDate);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiQuery({ name: 'type', required: true, enum: ['conversations', 'campaigns', 'agents', 'flows'] })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'pdf'] })
  @ApiQuery({ name: 'start', required: false, type: String })
  @ApiQuery({ name: 'end', required: false, type: String })
  @ApiResponse({ status: 200, description: 'File generated' })
  async exportAnalytics(
    @CurrentUser() user: any,
    @Query('type') type: 'conversations' | 'campaigns' | 'agents' | 'flows',
    @Query('format') format?: 'csv' | 'pdf',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Res() res?: Response,
  ) {
    const exportFormat = format || 'csv';
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    let data: any;
    let filename: string;

    switch (type) {
      case 'conversations':
        data = await this.analyticsService.getConversationAnalytics(user.tenantId, startDate, endDate);
        filename = 'conversations-analytics';
        break;
      case 'campaigns':
        data = await this.analyticsService.getCampaignPerformance(user.tenantId);
        filename = 'campaign-analytics';
        break;
      case 'agents':
        data = await this.analyticsService.getAgentPerformance(user.tenantId, startDate, endDate);
        filename = 'agent-performance';
        break;
      case 'flows':
        data = await this.analyticsService.getFlowPerformance(user.tenantId);
        filename = 'flow-analytics';
        break;
    }

    if (exportFormat === 'csv') {
      const csv = await this.analyticsService.exportToCSV(Array.isArray(data) ? data : [data]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      res.send(csv);
    } else {
      // PDF export would be implemented here
      res.status(501).json({ message: 'PDF export not yet implemented' });
    }
  }
}

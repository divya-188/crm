import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { TestWebhookDto } from './dto/test-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async create(@Request() req, @Body() createWebhookDto: CreateWebhookDto) {
    const webhook = await this.webhooksService.create(
      req.user.tenantId,
      createWebhookDto,
    );

    return {
      message: 'Webhook created successfully',
      data: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        retryCount: webhook.retryCount,
        timeoutSeconds: webhook.timeoutSeconds,
        isActive: webhook.isActive,
        status: webhook.status,
        createdAt: webhook.createdAt,
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhooks with pagination' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const result = await this.webhooksService.findAll(req.user.tenantId, page, limit, status);

    return {
      data: result.data.map((webhook) => ({
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        retryCount: webhook.retryCount,
        timeoutSeconds: webhook.timeoutSeconds,
        isActive: webhook.isActive,
        status: webhook.status,
        totalDeliveries: webhook.totalDeliveries,
        successfulDeliveries: webhook.successfulDeliveries,
        failedDeliveries: webhook.failedDeliveries,
        lastTriggeredAt: webhook.lastTriggeredAt,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  }

  @Get('events')
  @ApiOperation({ summary: 'Get available webhook events' })
  @ApiResponse({ status: 200, description: 'List of available events' })
  async getAvailableEvents() {
    const events = this.webhooksService.getAvailableEvents();

    return {
      data: events,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook details' })
  @ApiResponse({ status: 200, description: 'Webhook details' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    const webhook = await this.webhooksService.findOne(req.user.tenantId, id);

    return {
      data: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        retryCount: webhook.retryCount,
        timeoutSeconds: webhook.timeoutSeconds,
        isActive: webhook.isActive,
        status: webhook.status,
        totalDeliveries: webhook.totalDeliveries,
        successfulDeliveries: webhook.successfulDeliveries,
        failedDeliveries: webhook.failedDeliveries,
        lastTriggeredAt: webhook.lastTriggeredAt,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
      },
    };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    const webhook = await this.webhooksService.update(
      req.user.tenantId,
      id,
      updateWebhookDto,
    );

    return {
      message: 'Webhook updated successfully',
      data: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        retryCount: webhook.retryCount,
        timeoutSeconds: webhook.timeoutSeconds,
        isActive: webhook.isActive,
        status: webhook.status,
        updatedAt: webhook.updatedAt,
      },
    };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.webhooksService.remove(req.user.tenantId, id);

    return {
      message: 'Webhook deleted successfully',
    };
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test webhook' })
  @ApiResponse({ status: 200, description: 'Webhook test initiated' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async testWebhook(
    @Request() req,
    @Param('id') id: string,
    @Body() testWebhookDto: TestWebhookDto,
  ) {
    const result = await this.webhooksService.testWebhook(
      req.user.tenantId,
      id,
      testWebhookDto.eventType,
      testWebhookDto.payload,
    );

    return result;
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get webhook delivery logs' })
  @ApiResponse({ status: 200, description: 'Webhook logs' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of logs to return' })
  async getLogs(
    @Request() req,
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    const logs = await this.webhooksService.getLogs(
      req.user.tenantId,
      id,
      limit ? parseInt(limit.toString()) : 50,
    );

    return {
      data: logs,
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get webhook statistics' })
  @ApiResponse({ status: 200, description: 'Webhook statistics' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async getStats(@Request() req, @Param('id') id: string) {
    const stats = await this.webhooksService.getStats(req.user.tenantId, id);

    return {
      data: stats,
    };
  }
}

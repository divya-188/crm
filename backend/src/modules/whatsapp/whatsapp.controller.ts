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
import { WhatsAppService } from './whatsapp.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { QuotaGuard } from '../subscriptions/guards/quota.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { QuotaResource } from '../subscriptions/decorators/quota.decorator';
import { UserRole } from '../users/entities/user.entity';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('WhatsApp')
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('connections')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(QuotaGuard)
  @QuotaResource('whatsapp_connections')
  @ApiOperation({ summary: 'Create a new WhatsApp connection' })
  @ApiResponse({ status: 201, description: 'Connection created' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required or quota limit exceeded' })
  create(@TenantId() tenantId: string, @Body() createConnectionDto: CreateConnectionDto) {
    return this.whatsappService.create(tenantId, createConnectionDto);
  }

  @Get('connections')
  @ApiOperation({ summary: 'Get all WhatsApp connections with pagination' })
  @ApiResponse({ status: 200, description: 'List of connections retrieved' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.whatsappService.findAll(tenantId, page, limit, status, type, search);
  }

  @Get('connections/:id')
  @ApiOperation({ summary: 'Get WhatsApp connection by ID' })
  @ApiResponse({ status: 200, description: 'Connection retrieved' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.whatsappService.findOne(tenantId, id);
  }

  @Patch('connections/:id')
  @ApiOperation({ summary: 'Update WhatsApp connection' })
  @ApiResponse({ status: 200, description: 'Connection updated' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateData: Partial<CreateConnectionDto>,
  ) {
    return this.whatsappService.update(tenantId, id, updateData as any);
  }

  @Delete('connections/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete WhatsApp connection' })
  @ApiResponse({ status: 200, description: 'Connection deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.whatsappService.remove(tenantId, id);
  }

  @Post('connections/:id/disconnect')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Disconnect WhatsApp connection' })
  @ApiResponse({ status: 200, description: 'Connection disconnected' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  disconnect(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.whatsappService.disconnect(tenantId, id);
  }

  @Post('connections/:id/reconnect')
  @ApiOperation({ summary: 'Reconnect WhatsApp connection' })
  @ApiResponse({ status: 200, description: 'Connection reconnected' })
  reconnect(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.whatsappService.reconnect(tenantId, id);
  }

  @Get('connections/:id/qr')
  @ApiOperation({ summary: 'Get QR code for Baileys connection' })
  @ApiResponse({ status: 200, description: 'QR code retrieved' })
  getQRCode(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.whatsappService.getQRCode(tenantId, id);
  }

  @Post('connections/:id/send')
  @ApiOperation({ summary: 'Send a message via WhatsApp' })
  @ApiResponse({ status: 200, description: 'Message sent' })
  sendMessage(
    @TenantId() tenantId: string,
    @Param('id') connectionId: string,
    @Body() data: { to: string; message: string },
  ) {
    return this.whatsappService.sendMessage(tenantId, connectionId, data.to, data.message);
  }

  @Get('connections/:id/health')
  @ApiOperation({ summary: 'Check connection health' })
  @ApiResponse({ status: 200, description: 'Health status retrieved' })
  checkHealth(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.whatsappService.checkHealth(tenantId, id);
  }
}

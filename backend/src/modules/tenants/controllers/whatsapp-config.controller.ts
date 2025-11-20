import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { WhatsAppConfigService } from '../services/whatsapp-config.service';
import { CreateWhatsAppConfigDto, UpdateWhatsAppConfigDto } from '../dto/whatsapp-config.dto';

@Controller('settings/whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WhatsAppConfigController {
  constructor(private readonly whatsappConfigService: WhatsAppConfigService) {}

  @Get()
  @Roles('admin')
  async getConfig(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.whatsappConfigService.findByTenantId(tenantId);
  }

  @Post()
  @Roles('admin')
  async createConfig(@Request() req, @Body() createDto: CreateWhatsAppConfigDto) {
    const tenantId = req.user.tenantId;
    return this.whatsappConfigService.create(tenantId, createDto);
  }

  @Put()
  @Roles('admin')
  async updateConfig(@Request() req, @Body() updateDto: UpdateWhatsAppConfigDto) {
    const tenantId = req.user.tenantId;
    return this.whatsappConfigService.update(tenantId, updateDto);
  }

  @Delete()
  @Roles('admin')
  async deleteConfig(@Request() req) {
    const tenantId = req.user.tenantId;
    await this.whatsappConfigService.delete(tenantId);
    return { message: 'WhatsApp configuration deleted successfully' };
  }

  @Post('test')
  @Roles('admin')
  async testConnection(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.whatsappConfigService.testConnection(tenantId);
  }

  @Post('test-with-data')
  @Roles('admin')
  async testConnectionWithData(@Request() req, @Body() data: { accessToken: string; phoneNumberId: string }) {
    return this.whatsappConfigService.testConnectionWithData(data.accessToken, data.phoneNumberId);
  }

  @Post('regenerate-secret')
  @Roles('admin')
  async regenerateSecret(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.whatsappConfigService.regenerateWebhookSecret(tenantId);
  }
}

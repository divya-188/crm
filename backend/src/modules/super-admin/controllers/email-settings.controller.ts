import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EmailSettingsService } from '../services/email-settings.service';
import { UpdateEmailSettingsDto, SendTestEmailDto } from '../dto/update-email-settings.dto';

@Controller('super-admin/settings/email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class EmailSettingsController {
  constructor(private readonly emailSettingsService: EmailSettingsService) {}

  @Get()
  async getSettings() {
    return this.emailSettingsService.getSettings();
  }

  @Put()
  async updateSettings(
    @Body() dto: UpdateEmailSettingsDto,
    @Request() req,
  ) {
    return this.emailSettingsService.updateSettings(dto as any, req.user.userId);
  }

  @Post('test-connection')
  async testConnection(@Body() dto: UpdateEmailSettingsDto) {
    return this.emailSettingsService.testConnection(dto as any);
  }

  @Post('send-test')
  async sendTestEmail(@Body() dto: SendTestEmailDto) {
    return this.emailSettingsService.sendTestEmail(dto.to);
  }
}

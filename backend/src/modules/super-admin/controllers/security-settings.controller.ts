import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SecuritySettingsService } from '../services/security-settings.service';
import { UpdateSecuritySettingsDto } from '../dto/update-security-settings.dto';

@Controller('super-admin/settings/security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class SecuritySettingsController {
  constructor(private readonly securitySettingsService: SecuritySettingsService) {}

  @Get()
  async getSettings() {
    return this.securitySettingsService.getSettings();
  }

  @Put()
  async updateSettings(
    @Body() dto: UpdateSecuritySettingsDto,
    @Request() req,
  ) {
    return this.securitySettingsService.updateSettings(dto as any, req.user.userId);
  }
}

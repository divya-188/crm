import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { IntegrationsSettingsService, IntegrationSettings } from '../services/integrations-settings.service';

@Controller('tenants/:tenantId/settings/integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsSettingsController {
  constructor(
    private integrationsSettingsService: IntegrationsSettingsService,
  ) {}

  @Get()
  @Roles('admin', 'super_admin')
  async getIntegrationSettings(@Req() req: any) {
    return this.integrationsSettingsService.getIntegrationSettings(
      req.user.tenantId,
    );
  }

  @Put()
  @Roles('admin', 'super_admin')
  async updateIntegrationSettings(
    @Req() req: any,
    @Body() settings: Partial<IntegrationSettings>,
  ) {
    return this.integrationsSettingsService.updateIntegrationSettings(
      req.user.tenantId,
      settings,
      req.user.id,
    );
  }
}

import { Controller, Get, Put, Body, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PreferencesSettingsService, UserPreferences } from '../services/preferences-settings.service';

@Controller('users/:userId/settings/preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesSettingsController {
  constructor(
    private preferencesSettingsService: PreferencesSettingsService,
  ) {}

  @Get()
  async getPreferences(@Param('userId') userId: string) {
    return this.preferencesSettingsService.getPreferences(userId);
  }

  @Put()
  async updatePreferences(
    @Param('userId') userId: string,
    @Req() req: any,
    @Body() preferences: Partial<UserPreferences>,
  ) {
    return this.preferencesSettingsService.updatePreferences(
      userId,
      preferences,
      req.user.id,
    );
  }
}

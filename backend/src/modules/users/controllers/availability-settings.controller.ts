import { Controller, Get, Put, Body, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AvailabilitySettingsService, AvailabilitySettings, AgentStatus } from '../services/availability-settings.service';

@Controller('users/:userId/settings/availability')
@UseGuards(JwtAuthGuard)
export class AvailabilitySettingsController {
  constructor(
    private availabilitySettingsService: AvailabilitySettingsService,
  ) {}

  @Get()
  async getAvailabilitySettings(@Param('userId') userId: string) {
    return this.availabilitySettingsService.getAvailabilitySettings(userId);
  }

  @Put()
  async updateAvailabilitySettings(
    @Param('userId') userId: string,
    @Req() req: any,
    @Body() settings: Partial<AvailabilitySettings>,
  ) {
    return this.availabilitySettingsService.updateAvailabilitySettings(
      userId,
      settings,
      req.user.id,
    );
  }

  @Put('status')
  async updateStatus(
    @Param('userId') userId: string,
    @Body('status') status: AgentStatus,
  ) {
    await this.availabilitySettingsService.updateStatus(userId, status);
    return { success: true, status };
  }
}

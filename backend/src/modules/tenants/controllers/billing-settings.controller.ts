import { Controller, Get, Put, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { BillingSettingsService, BillingInfo } from '../services/billing-settings.service';

@Controller('tenants/:tenantId/settings/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingSettingsController {
  constructor(
    private billingSettingsService: BillingSettingsService,
  ) {}

  @Get('subscription')
  @Roles('admin', 'super_admin')
  async getCurrentSubscription(@Req() req: any) {
    return this.billingSettingsService.getCurrentSubscription(req.user.tenantId);
  }

  @Get('usage')
  @Roles('admin', 'super_admin')
  async getUsageStatistics(@Req() req: any) {
    return this.billingSettingsService.getUsageStatistics(req.user.tenantId);
  }

  @Get('info')
  @Roles('admin', 'super_admin')
  async getBillingInfo(@Req() req: any) {
    return this.billingSettingsService.getBillingInfo(req.user.tenantId);
  }

  @Put('info')
  @Roles('admin', 'super_admin')
  async updateBillingInfo(
    @Req() req: any,
    @Body() billingInfo: BillingInfo,
  ) {
    return this.billingSettingsService.updateBillingInfo(
      req.user.tenantId,
      billingInfo,
      req.user.id,
    );
  }

  @Post('change-plan')
  @Roles('admin', 'super_admin')
  async changePlan(
    @Req() req: any,
    @Body('planId') planId: string,
  ) {
    return this.billingSettingsService.changePlan(
      req.user.tenantId,
      planId,
      req.user.id,
    );
  }

  @Post('cancel')
  @Roles('admin', 'super_admin')
  async cancelSubscription(
    @Req() req: any,
    @Body('reason') reason: string,
  ) {
    return this.billingSettingsService.cancelSubscription(
      req.user.tenantId,
      reason,
      req.user.id,
    );
  }

  @Get('history')
  @Roles('admin', 'super_admin')
  async getBillingHistory(
    @Req() req: any,
    @Query('limit') limit?: number,
  ) {
    return this.billingSettingsService.getBillingHistory(
      req.user.tenantId,
      limit,
    );
  }

  @Get('payment-method')
  @Roles('admin', 'super_admin')
  async getPaymentMethod(@Req() req: any) {
    return this.billingSettingsService.getPaymentMethod(req.user.tenantId);
  }

  @Put('payment-method')
  @Roles('admin', 'super_admin')
  async updatePaymentMethod(
    @Req() req: any,
    @Body('paymentMethodId') paymentMethodId: string,
  ) {
    return this.billingSettingsService.updatePaymentMethod(
      req.user.tenantId,
      paymentMethodId,
      req.user.id,
    );
  }
}

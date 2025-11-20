import { Controller, Get, Put, Post, Body, UseGuards, Request, Inject, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PaymentGatewaySettingsService } from '../services/payment-gateway-settings.service';
import { UpdatePaymentGatewayDto, TestConnectionDto } from '../dto/update-payment-gateway.dto';
import { UnifiedPaymentService } from '../../subscriptions/services/unified-payment.service';

@Controller('super-admin/settings/payment-gateway')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class PaymentGatewaySettingsController {
  constructor(
    private readonly paymentGatewayService: PaymentGatewaySettingsService,
    @Inject(forwardRef(() => UnifiedPaymentService))
    private readonly unifiedPaymentService: UnifiedPaymentService,
  ) {}

  @Get()
  async getSettings() {
    return this.paymentGatewayService.getSettings();
  }

  @Put()
  async updateSettings(
    @Body() dto: UpdatePaymentGatewayDto,
    @Request() req,
  ) {
    const updated = await this.paymentGatewayService.updateSettings(dto as any, req.user.userId);
    
    // Refresh payment service configurations immediately
    await this.unifiedPaymentService.refreshConfiguration();
    
    return updated;
  }

  @Post('test-connection')
  async testConnection(@Body() dto: TestConnectionDto) {
    const { provider, credentials } = dto;

    switch (provider) {
      case 'stripe':
        return this.paymentGatewayService.testStripeConnection(
          credentials.publicKey,
          credentials.secretKey,
        );
      case 'paypal':
        return this.paymentGatewayService.testPayPalConnection(
          credentials.clientId,
          credentials.clientSecret,
          credentials.mode,
        );
      case 'razorpay':
        return this.paymentGatewayService.testRazorpayConnection(
          credentials.keyId,
          credentials.keySecret,
        );
      default:
        return { success: false, message: 'Unknown provider' };
    }
  }
}

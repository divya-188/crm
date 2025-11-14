import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
  Req,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UnifiedPaymentService } from './services/unified-payment.service';
import { InvoiceService } from './services/invoice.service';
import { SubscriptionLifecycleService } from './services/subscription-lifecycle.service';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  PaymentProvider,
} from './dto/create-subscription.dto';
import {
  UpgradeSubscriptionDto,
  DowngradeSubscriptionDto,
  ApplyCouponDto,
  RenewSubscriptionDto,
} from './dto/upgrade-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly paymentService: UnifiedPaymentService,
    private readonly invoiceService: InvoiceService,
    private readonly lifecycleService: SubscriptionLifecycleService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new subscription with payment' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid plan or payment details' })
  @ApiResponse({ status: 402, description: 'Payment processing failed' })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const customerEmail = req.user.email;

    const subscription = await this.subscriptionsService.createSubscriptionWithPayment(
      tenantId,
      customerEmail,
      createSubscriptionDto,
    );

    return {
      success: true,
      data: subscription,
      message: 'Subscription created successfully',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid subscription or cancellation failed' })
  @ApiResponse({ status: 403, description: 'User does not have permission to cancel' })
  async cancelSubscription(
    @Param('id') subscriptionId: string,
    @Body() cancelDto: CancelSubscriptionDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    
    const subscription = await this.lifecycleService.cancelSubscription(
      subscriptionId,
      tenantId,
      cancelDto.cancellationReason,
      cancelDto.cancelImmediately,
    );

    return {
      success: true,
      data: subscription,
      message: cancelDto.cancelImmediately 
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the current period',
    };
  }

  @Get(':id/sync')
  @UseGuards(JwtAuthGuard)
  async syncSubscription(@Param('id') subscriptionId: string) {
    const subscription = await this.paymentService.syncSubscriptionStatus(
      subscriptionId,
    );

    return {
      success: true,
      data: subscription,
    };
  }

  @Get(':id/invoice')
  @UseGuards(JwtAuthGuard)
  async downloadInvoice(
    @Param('id') subscriptionId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.invoiceService.generateInvoice(subscriptionId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${subscriptionId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe signature');
    }

    await this.paymentService.handleWebhook(
      PaymentProvider.STRIPE,
      payload,
      signature,
    );

    return { received: true };
  }

  @Post('webhooks/paypal')
  @HttpCode(HttpStatus.OK)
  async handlePayPalWebhook(
    @Body() payload: any,
    @Headers('paypal-transmission-sig') signature: string,
  ) {
    await this.paymentService.handleWebhook(
      PaymentProvider.PAYPAL,
      payload,
      signature || '',
    );

    return { received: true };
  }

  @Post('webhooks/razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing razorpay signature');
    }

    await this.paymentService.handleWebhook(
      PaymentProvider.RAZORPAY,
      payload,
      signature,
    );

    return { received: true };
  }

  @Post(':id/renew')
  @UseGuards(JwtAuthGuard)
  async renewSubscription(
    @Param('id') subscriptionId: string,
    @Body() renewDto: RenewSubscriptionDto,
  ) {
    const subscription = await this.lifecycleService.renewSubscription(
      subscriptionId,
    );

    return {
      success: true,
      data: subscription,
    };
  }

  @Patch(':id/upgrade')
  @UseGuards(JwtAuthGuard)
  async upgradeSubscription(
    @Param('id') subscriptionId: string,
    @Body() upgradeDto: UpgradeSubscriptionDto,
  ) {
    const subscription = await this.lifecycleService.upgradeSubscription(
      subscriptionId,
      upgradeDto.newPlanId,
      upgradeDto.paymentProvider,
      upgradeDto.paymentMethodId,
    );

    return {
      success: true,
      data: subscription,
      message: 'Subscription upgraded successfully',
    };
  }

  @Patch(':id/downgrade')
  @UseGuards(JwtAuthGuard)
  async downgradeSubscription(
    @Param('id') subscriptionId: string,
    @Body() downgradeDto: DowngradeSubscriptionDto,
  ) {
    const subscription = await this.lifecycleService.downgradeSubscription(
      subscriptionId,
      downgradeDto.newPlanId,
    );

    return {
      success: true,
      data: subscription,
      message: 'Subscription will be downgraded at the end of current period',
    };
  }

  @Post(':id/coupon')
  @UseGuards(JwtAuthGuard)
  async applyCoupon(
    @Param('id') subscriptionId: string,
    @Body() couponDto: ApplyCouponDto,
  ) {
    const subscription = await this.lifecycleService.applyCouponCode(
      subscriptionId,
      couponDto.couponCode,
    );

    return {
      success: true,
      data: subscription,
      message: 'Coupon applied successfully',
    };
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription retrieved' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async getCurrentSubscription(@Req() req: any) {
    return this.subscriptionsService.getCurrentSubscription(req.user.tenantId);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get subscription usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics retrieved' })
  async getUsageStatistics(@Req() req: any) {
    return this.subscriptionsService.getUsageStatistics(req.user.tenantId);
  }

  @Get('tenant/:tenantId')
  @UseGuards(JwtAuthGuard)
  async getTenantSubscription(@Param('tenantId') tenantId: string) {
    // This would be implemented to get current active subscription for a tenant
    return {
      success: true,
      message: 'Get tenant subscription endpoint',
    };
  }
}

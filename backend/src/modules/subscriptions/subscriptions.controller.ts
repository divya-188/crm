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
  Logger,
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
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private readonly paymentService: UnifiedPaymentService,
    private readonly invoiceService: InvoiceService,
    private readonly lifecycleService: SubscriptionLifecycleService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get('payment-config')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment configuration' })
  @ApiResponse({ status: 200, description: 'Payment configuration retrieved successfully' })
  async getPaymentConfig() {
    const defaultProvider = process.env.PAYMENT_PREFERENCE || 'stripe';
    const paymentMode = process.env.PAYMENT_MODE || 'sandbox';
    
    // Determine available providers based on configuration
    const availableProviders: string[] = [];
    
    if (process.env.STRIPE_SECRET_KEY) {
      availableProviders.push('stripe');
    }
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      availableProviders.push('paypal');
    }
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      availableProviders.push('razorpay');
    }
    
    return {
      success: true,
      data: {
        defaultProvider,
        paymentMode,
        availableProviders: availableProviders.length > 0 ? availableProviders : ['stripe'],
      },
    };
  }

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

    // Extract checkout URL from metadata if present
    const checkoutUrl = subscription.metadata?.checkoutUrl;

    return {
      success: true,
      data: {
        ...subscription,
        checkoutUrl, // Include at top level for easier access
      },
      message: checkoutUrl 
        ? 'Redirecting to payment checkout...' 
        : 'Subscription created successfully',
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

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all invoices for current tenant' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async getInvoices(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const invoices = await this.invoiceService.getInvoicesForTenant(tenantId);

    return {
      success: true,
      data: invoices,
    };
  }

  @Get('invoices/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get invoice details' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(
    @Param('id') invoiceId: string,
    @Req() req: any,
  ) {
    const invoice = await this.invoiceService.getInvoice(invoiceId);
    
    // Verify user has access to this invoice
    if (invoice.tenantId !== req.user.tenantId) {
      throw new BadRequestException('Access denied to this invoice');
    }

    return {
      success: true,
      data: invoice,
    };
  }

  @Get('invoices/:id/download')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiResponse({ status: 200, description: 'Invoice PDF downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async downloadInvoice(
    @Param('id') invoiceId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const invoice = await this.invoiceService.getInvoice(invoiceId);
    
    // Verify user has access to this invoice
    if (invoice.tenantId !== req.user.tenantId) {
      throw new BadRequestException('Access denied to this invoice');
    }

    const pdfBuffer = await this.invoiceService.generateInvoicePDF(invoiceId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${invoice.invoiceNumber}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get(':id/invoice')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download invoice for subscription (legacy)' })
  async downloadSubscriptionInvoice(
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
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe signature');
    }

    // Stripe requires the raw body for signature verification
    // The body will be a Buffer when using bodyParser.raw()
    const rawBody = req.body;

    await this.paymentService.handleWebhook(
      PaymentProvider.STRIPE,
      rawBody,
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
  @ApiOperation({ summary: 'Handle Razorpay webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleRazorpayWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    this.logger.log('🔔 [RAZORPAY-WEBHOOK] Received webhook');
    this.logger.log(`📦 [RAZORPAY-WEBHOOK] Event: ${payload.event}`);
    this.logger.log(`📦 [RAZORPAY-WEBHOOK] Payload:`, JSON.stringify(payload, null, 2));

    try {
      await this.paymentService.handleWebhook(
        PaymentProvider.RAZORPAY,
        payload,
        signature || '',
      );

      this.logger.log('✅ [RAZORPAY-WEBHOOK] Webhook processed successfully');
      return { received: true, status: 'success' };
    } catch (error) {
      this.logger.error(`❌ [RAZORPAY-WEBHOOK] Error processing webhook: ${error.message}`);
      this.logger.error(`❌ [RAZORPAY-WEBHOOK] Stack:`, error.stack);
      
      // Return 200 anyway to prevent Razorpay from retrying
      // Log the error for manual investigation
      return { received: true, status: 'error', error: error.message };
    }
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
    this.logger.log(`🎯 [CONTROLLER] Upgrade request received`);
    this.logger.log(`🎯 [CONTROLLER] Subscription ID: ${subscriptionId}`);
    this.logger.log(`🎯 [CONTROLLER] New Plan ID: ${upgradeDto.newPlanId}`);
    this.logger.log(`🎯 [CONTROLLER] Payment Provider: ${upgradeDto.paymentProvider}`);

    const subscription = await this.lifecycleService.upgradeSubscription(
      subscriptionId,
      upgradeDto.newPlanId,
      upgradeDto.paymentProvider,
      upgradeDto.paymentMethodId,
    );

    this.logger.log(`🎯 [CONTROLLER] Subscription returned from service`);
    this.logger.log(`🎯 [CONTROLLER] Subscription metadata: ${JSON.stringify(subscription.metadata)}`);

    // Extract checkout URL from metadata if present
    const checkoutUrl = subscription.metadata?.checkoutUrl;
    const proratedAmount = subscription.metadata?.proratedAmount;

    this.logger.log(`🎯 [CONTROLLER] Extracted checkout URL: ${checkoutUrl}`);
    this.logger.log(`🎯 [CONTROLLER] Extracted prorated amount: ${proratedAmount}`);

    if (checkoutUrl) {
      // Payment required - return checkout URL for redirect
      this.logger.log(`✅ [CONTROLLER] Returning checkout URL for payment`);
      return {
        success: true,
        data: {
          checkoutUrl,
          proratedAmount,
          subscriptionId: subscription.id,
        },
        message: 'Please complete payment to upgrade your plan',
      };
    }

    // No payment required (free upgrade or already paid)
    this.logger.log(`⚠️ [CONTROLLER] No checkout URL found - returning success without payment`);
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

  @Post(':id/activate-razorpay')
  @ApiOperation({ summary: 'Activate Razorpay subscription after payment' })
  @ApiResponse({ status: 200, description: 'Subscription activated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async activateRazorpaySubscription(
    @Param('id') subscriptionIdParam: string,
    @Body() body: { subscriptionId: string; tenantId: string; razorpayPaymentId?: string; razorpayPaymentLinkId?: string },
  ) {
    this.logger.log('🎯 [RAZORPAY ACTIVATION] Endpoint called');
    this.logger.log(`📋 [RAZORPAY ACTIVATION] Subscription ID from URL: ${subscriptionIdParam}`);
    this.logger.log(`📋 [RAZORPAY ACTIVATION] Body:`, JSON.stringify(body));
    
    try {
      // Verify tenant ID is provided
      if (!body.tenantId) {
        this.logger.error('❌ [RAZORPAY ACTIVATION] Missing tenant ID');
        throw new BadRequestException('Tenant ID is required');
      }

      // Check if the ID is a UUID (database ID) or Razorpay subscription ID
      // UUIDs have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      // Razorpay IDs have format: sub_xxxxx
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subscriptionIdParam);
      
      let subscription;
      if (isUUID) {
        this.logger.log(`🔍 [RAZORPAY ACTIVATION] Looking up by database UUID`);
        // For upgrades - direct database lookup
        subscription = await this.subscriptionsService.findById(subscriptionIdParam);
      } else {
        this.logger.log(`🔍 [RAZORPAY ACTIVATION] Looking up by Razorpay subscription ID`);
        // For initial subscriptions - lookup by Razorpay ID
        subscription = await this.subscriptionsService.findByRazorpayId(subscriptionIdParam);
      }

      if (!subscription) {
        this.logger.error('❌ [RAZORPAY ACTIVATION] Subscription not found');
        throw new BadRequestException('Subscription not found');
      }

      if (subscription.tenantId !== body.tenantId) {
        this.logger.error('❌ [RAZORPAY ACTIVATION] Tenant ID mismatch');
        throw new BadRequestException('Invalid tenant ID for this subscription');
      }
      
      this.logger.log(`🔄 [RAZORPAY ACTIVATION] Found subscription: ${subscription.id}`);
      this.logger.log(`🔄 [RAZORPAY ACTIVATION] Calling activateSubscription...`);
      
      // Activate the subscription using the database UUID
      await this.paymentService.activateSubscription(
        subscription.id,
        body.tenantId,
      );

      this.logger.log(`✅ [RAZORPAY ACTIVATION] Subscription activated successfully`);

      return {
        success: true,
        message: 'Razorpay subscription activated successfully',
      };
    } catch (error) {
      this.logger.error('❌ [RAZORPAY ACTIVATION] Failed to activate:', error.message);
      this.logger.error('❌ [RAZORPAY ACTIVATION] Stack:', error.stack);
      return {
        success: false,
        message: 'Subscription activation pending. Will be activated via webhook.',
        error: error.message,
      };
    }
  }

  @Post('activate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Activate subscription after successful checkout' })
  @ApiResponse({ status: 200, description: 'Subscription activated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async activateSubscription(
    @Body() body: { sessionId: string },
    @Req() req: any,
  ) {
    try {
      const tenantId = req.user.tenantId;
      
      // Find subscription by session ID
      const subscription = await this.subscriptionsService.findBySessionId(
        body.sessionId,
        tenantId,
      );

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription not found for this session',
        };
      }

      // Activate the subscription
      await this.paymentService.activateSubscription(
        subscription.id,
        tenantId,
      );

      return {
        success: true,
        message: 'Subscription activated successfully',
        subscription,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to activate subscription',
      };
    }
  }

  @Get('session/:sessionId/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check session status' })
  @ApiResponse({ status: 200, description: 'Session status retrieved' })
  async getSessionStatus(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    return this.subscriptionsService.getSessionStatus(
      sessionId,
      req.user.tenantId,
    );
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription retrieved' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async getCurrentSubscription(@Req() req: any) {
    return this.subscriptionsService.getCurrentSubscription(req.user.tenantId);
  }

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my subscription (any status including pending)' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No subscription found' })
  async getMySubscription(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;

    // Super admin can view any tenant's subscription
    // Regular users can only view their own tenant's subscription
    const subscription = await this.subscriptionsService.getSubscriptionByTenant(
      tenantId,
    );

    if (!subscription) {
      throw new BadRequestException('No subscription found for this tenant');
    }

    return {
      success: true,
      data: subscription,
    };
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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getSubscriptionById(
    @Param('id') subscriptionId: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;

    const subscription = await this.subscriptionsService.findById(subscriptionId);

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    // Authorization check: super_admin can view any subscription
    // Regular users can only view their own tenant's subscription
    if (userRole !== 'super_admin' && subscription.tenantId !== tenantId) {
      throw new BadRequestException('Access denied to this subscription');
    }

    return {
      success: true,
      data: subscription,
    };
  }

  @Post(':id/reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reactivate a suspended subscription' })
  @ApiResponse({ status: 200, description: 'Subscription reactivated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid subscription or reactivation failed' })
  @ApiResponse({ status: 402, description: 'Payment processing failed' })
  @ApiResponse({ status: 403, description: 'User does not have permission to reactivate' })
  async reactivateSubscription(
    @Param('id') subscriptionId: string,
    @Body() body: { paymentMethodId?: string },
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    
    const subscription = await this.lifecycleService.reactivateSubscription(
      subscriptionId,
      tenantId,
      body.paymentMethodId,
    );

    return {
      success: true,
      data: subscription,
      message: 'Subscription reactivated successfully',
    };
  }
}

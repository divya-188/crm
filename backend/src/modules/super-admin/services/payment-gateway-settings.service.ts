import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSettings } from '../entities/platform-settings.entity';
import { EncryptionService } from '../../../common/services/encryption.service';
import { SettingsCacheService } from '../../../common/services/settings-cache.service';
import { SettingsAuditService } from '../../../common/services/settings-audit.service';
import Stripe from 'stripe';
import Razorpay from 'razorpay';

export interface PaymentGatewayConfig {
  stripe?: {
    enabled: boolean;
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  paypal?: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
  };
  razorpay?: {
    enabled: boolean;
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
}

@Injectable()
export class PaymentGatewaySettingsService {
  private readonly logger = new Logger(PaymentGatewaySettingsService.name);

  constructor(
    @InjectRepository(PlatformSettings)
    private readonly settingsRepo: Repository<PlatformSettings>,
    private readonly encryptionService: EncryptionService,
    private readonly cacheService: SettingsCacheService,
    private readonly auditService: SettingsAuditService,
  ) {}

  async getSettings(): Promise<PaymentGatewayConfig> {
    const cacheKey = 'platform:payment_gateway';
    const cached = await this.cacheService.get<PaymentGatewayConfig>(cacheKey);
    if (cached) return cached;

    const settings = await this.settingsRepo.findOne({
      where: { key: 'payment_gateway' },
    });

    if (!settings) {
      return this.getDefaultSettings();
    }

    const decrypted = this.decryptSensitiveFields(settings.value);
    await this.cacheService.set(cacheKey, decrypted, 3600);
    return decrypted;
  }

  async updateSettings(
    config: Partial<PaymentGatewayConfig>,
    userId: string,
  ): Promise<PaymentGatewayConfig> {
    const current = await this.getSettings();
    const updated = { ...current, ...config };

    const encrypted = this.encryptSensitiveFields(updated);

    await this.settingsRepo.upsert(
      {
        key: 'payment_gateway',
        value: encrypted,
        category: 'payment',
        updatedBy: userId,
      },
      ['key'],
    );

    await this.cacheService.invalidate('platform:payment_gateway');
    
    await this.auditService.log({
      userId,
      action: 'update',
      settingsType: 'payment_gateway',
      changes: this.sanitizeForAudit(config),
    });

    this.logger.log('Payment gateway settings updated - configuration will be refreshed on next payment operation');

    return updated;
  }

  async testStripeConnection(publicKey: string, secretKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const stripe = new Stripe(secretKey, { apiVersion: '2025-10-29.clover' });
      await stripe.balance.retrieve();
      return { success: true, message: 'Stripe connection successful' };
    } catch (error) {
      this.logger.error('Stripe connection test failed', error);
      return { success: false, message: error.message };
    }
  }

  async testPayPalConnection(clientId: string, clientSecret: string, mode: 'sandbox' | 'live'): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = mode === 'sandbox' 
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';

      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (response.ok) {
        return { success: true, message: 'PayPal connection successful' };
      } else {
        return { success: false, message: 'PayPal authentication failed' };
      }
    } catch (error) {
      this.logger.error('PayPal connection test failed', error);
      return { success: false, message: error.message };
    }
  }

  async testRazorpayConnection(keyId: string, keySecret: string): Promise<{ success: boolean; message: string }> {
    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      await razorpay.plans.all({ count: 1 });
      return { success: true, message: 'Razorpay connection successful' };
    } catch (error) {
      this.logger.error('Razorpay connection test failed', error);
      return { success: false, message: error.message };
    }
  }

  private getDefaultSettings(): PaymentGatewayConfig {
    return {
      stripe: { enabled: false, publicKey: '', secretKey: '', webhookSecret: '' },
      paypal: { enabled: false, clientId: '', clientSecret: '', mode: 'sandbox' },
      razorpay: { enabled: false, keyId: '', keySecret: '', webhookSecret: '' },
    };
  }

  private encryptSensitiveFields(config: PaymentGatewayConfig): any {
    const encrypted = { ...config };

    if (config.stripe?.secretKey) {
      encrypted.stripe.secretKey = this.encryptionService.encrypt(config.stripe.secretKey);
    }
    if (config.stripe?.webhookSecret) {
      encrypted.stripe.webhookSecret = this.encryptionService.encrypt(config.stripe.webhookSecret);
    }
    if (config.paypal?.clientSecret) {
      encrypted.paypal.clientSecret = this.encryptionService.encrypt(config.paypal.clientSecret);
    }
    if (config.razorpay?.keySecret) {
      encrypted.razorpay.keySecret = this.encryptionService.encrypt(config.razorpay.keySecret);
    }
    if (config.razorpay?.webhookSecret) {
      encrypted.razorpay.webhookSecret = this.encryptionService.encrypt(config.razorpay.webhookSecret);
    }

    return encrypted;
  }

  private decryptSensitiveFields(config: any): PaymentGatewayConfig {
    const decrypted = { ...config };

    if (config.stripe?.secretKey) {
      decrypted.stripe.secretKey = this.encryptionService.decrypt(config.stripe.secretKey);
    }
    if (config.stripe?.webhookSecret) {
      decrypted.stripe.webhookSecret = this.encryptionService.decrypt(config.stripe.webhookSecret);
    }
    if (config.paypal?.clientSecret) {
      decrypted.paypal.clientSecret = this.encryptionService.decrypt(config.paypal.clientSecret);
    }
    if (config.razorpay?.keySecret) {
      decrypted.razorpay.keySecret = this.encryptionService.decrypt(config.razorpay.keySecret);
    }
    if (config.razorpay?.webhookSecret) {
      decrypted.razorpay.webhookSecret = this.encryptionService.decrypt(config.razorpay.webhookSecret);
    }

    return decrypted;
  }

  private sanitizeForAudit(config: any): any {
    const sanitized = JSON.parse(JSON.stringify(config));
    
    if (sanitized.stripe?.secretKey) sanitized.stripe.secretKey = '***';
    if (sanitized.stripe?.webhookSecret) sanitized.stripe.webhookSecret = '***';
    if (sanitized.paypal?.clientSecret) sanitized.paypal.clientSecret = '***';
    if (sanitized.razorpay?.keySecret) sanitized.razorpay.keySecret = '***';
    if (sanitized.razorpay?.webhookSecret) sanitized.razorpay.webhookSecret = '***';

    return sanitized;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSignatureService {
  private readonly logger = new Logger(WebhookSignatureService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Verify webhook signature from Meta
   */
  verifySignature(payload: string, signature: string): boolean {
    try {
      const appSecret = this.configService.get('META_APP_SECRET');
      
      if (!appSecret) {
        this.logger.warn('META_APP_SECRET not configured, skipping signature verification');
        return true; // Allow in development
      }

      const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('hex');

      const isValid = `sha256=${expectedSignature}` === signature;

      if (!isValid) {
        this.logger.error('Invalid webhook signature');
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate signature for testing
   */
  generateSignature(payload: string): string {
    const appSecret = this.configService.get('META_APP_SECRET');
    const signature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');
    return `sha256=${signature}`;
  }
}

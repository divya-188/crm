import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSettings } from '../entities/platform-settings.entity';
import { EncryptionService } from '../../../common/services/encryption.service';
import { SettingsCacheService } from '../../../common/services/settings-cache.service';
import { SettingsAuditService } from '../../../common/services/settings-audit.service';
import * as nodemailer from 'nodemailer';

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  from: {
    name: string;
    email: string;
  };
}

@Injectable()
export class EmailSettingsService {
  private readonly logger = new Logger(EmailSettingsService.name);

  constructor(
    @InjectRepository(PlatformSettings)
    private readonly settingsRepo: Repository<PlatformSettings>,
    private readonly encryptionService: EncryptionService,
    private readonly cacheService: SettingsCacheService,
    private readonly auditService: SettingsAuditService,
  ) {}

  async getSettings(): Promise<EmailConfig> {
    const cacheKey = 'platform:email';
    const cached = await this.cacheService.get<EmailConfig>(cacheKey);
    if (cached) return cached;

    const settings = await this.settingsRepo.findOne({
      where: { key: 'email' },
    });

    if (!settings) {
      return this.getDefaultSettings();
    }

    const decrypted = this.decryptSensitiveFields(settings.value);
    await this.cacheService.set(cacheKey, decrypted, 3600);
    return decrypted;
  }

  async updateSettings(
    config: Partial<EmailConfig>,
    userId: string,
  ): Promise<EmailConfig> {
    const current = await this.getSettings();
    const updated = { ...current, ...config };

    const encrypted = this.encryptSensitiveFields(updated);

    await this.settingsRepo.upsert(
      {
        key: 'email',
        value: encrypted,
        category: 'email',
        updatedBy: userId,
      },
      ['key'],
    );

    await this.cacheService.invalidate('platform:email');

    await this.auditService.log({
      userId,
      action: 'update',
      settingsType: 'email',
      changes: this.sanitizeForAudit(config),
    });

    return updated;
  }

  async testConnection(config: EmailConfig): Promise<{ success: boolean; message: string }> {
    try {
      if (config.provider === 'smtp' && config.smtp) {
        return await this.testSMTP(config.smtp);
      } else if (config.provider === 'sendgrid' && config.sendgrid) {
        return await this.testSendGrid(config.sendgrid.apiKey);
      } else if (config.provider === 'mailgun' && config.mailgun) {
        return await this.testMailgun(config.mailgun);
      }
      return { success: false, message: 'Invalid email provider configuration' };
    } catch (error) {
      this.logger.error('Email connection test failed', error);
      return { success: false, message: error.message };
    }
  }

  async sendTestEmail(to: string, config?: EmailConfig): Promise<{ success: boolean; message: string }> {
    try {
      const emailConfig = config || await this.getSettings();
      
      if (emailConfig.provider === 'smtp' && emailConfig.smtp) {
        const transporter = nodemailer.createTransport({
          host: emailConfig.smtp.host,
          port: emailConfig.smtp.port,
          secure: emailConfig.smtp.secure,
          auth: emailConfig.smtp.auth,
        });

        await transporter.sendMail({
          from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
          to,
          subject: 'Test Email from WhatsCRM',
          html: '<p>This is a test email to verify your email configuration.</p>',
        });

        return { success: true, message: 'Test email sent successfully' };
      }

      return { success: false, message: 'Only SMTP provider is currently supported for test emails' };
    } catch (error) {
      this.logger.error('Failed to send test email', error);
      return { success: false, message: error.message };
    }
  }

  private async testSMTP(smtp: EmailConfig['smtp']): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: smtp.auth,
      });

      await transporter.verify();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      return { success: false, message: `SMTP connection failed: ${error.message}` };
    }
  }

  private async testSendGrid(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { success: true, message: 'SendGrid connection successful' };
      } else {
        return { success: false, message: 'SendGrid authentication failed' };
      }
    } catch (error) {
      return { success: false, message: `SendGrid connection failed: ${error.message}` };
    }
  }

  private async testMailgun(mailgun: EmailConfig['mailgun']): Promise<{ success: boolean; message: string }> {
    try {
      const auth = Buffer.from(`api:${mailgun.apiKey}`).toString('base64');
      const response = await fetch(`https://api.mailgun.net/v3/domains/${mailgun.domain}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      if (response.ok) {
        return { success: true, message: 'Mailgun connection successful' };
      } else {
        return { success: false, message: 'Mailgun authentication failed' };
      }
    } catch (error) {
      return { success: false, message: `Mailgun connection failed: ${error.message}` };
    }
  }

  private getDefaultSettings(): EmailConfig {
    return {
      provider: 'smtp',
      smtp: {
        host: '',
        port: 587,
        secure: false,
        auth: { user: '', pass: '' },
      },
      from: {
        name: 'WhatsCRM',
        email: 'noreply@whatscrm.com',
      },
    };
  }

  private encryptSensitiveFields(config: EmailConfig): any {
    const encrypted = JSON.parse(JSON.stringify(config));

    if (config.smtp?.auth?.pass) {
      encrypted.smtp.auth.pass = this.encryptionService.encrypt(config.smtp.auth.pass);
    }
    if (config.sendgrid?.apiKey) {
      encrypted.sendgrid.apiKey = this.encryptionService.encrypt(config.sendgrid.apiKey);
    }
    if (config.mailgun?.apiKey) {
      encrypted.mailgun.apiKey = this.encryptionService.encrypt(config.mailgun.apiKey);
    }

    return encrypted;
  }

  private decryptSensitiveFields(config: any): EmailConfig {
    const decrypted = JSON.parse(JSON.stringify(config));

    if (config.smtp?.auth?.pass) {
      decrypted.smtp.auth.pass = this.encryptionService.decrypt(config.smtp.auth.pass);
    }
    if (config.sendgrid?.apiKey) {
      decrypted.sendgrid.apiKey = this.encryptionService.decrypt(config.sendgrid.apiKey);
    }
    if (config.mailgun?.apiKey) {
      decrypted.mailgun.apiKey = this.encryptionService.decrypt(config.mailgun.apiKey);
    }

    return decrypted;
  }

  private sanitizeForAudit(config: any): any {
    const sanitized = JSON.parse(JSON.stringify(config));

    if (sanitized.smtp?.auth?.pass) sanitized.smtp.auth.pass = '***';
    if (sanitized.sendgrid?.apiKey) sanitized.sendgrid.apiKey = '***';
    if (sanitized.mailgun?.apiKey) sanitized.mailgun.apiKey = '***';

    return sanitized;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppConfig } from '../entities/whatsapp-config.entity';
import { CreateWhatsAppConfigDto, UpdateWhatsAppConfigDto } from '../dto/whatsapp-config.dto';
import { MetaApiService } from '../../whatsapp/services/meta-api.service';
import * as crypto from 'crypto';
import { ErrorHandler } from '../../../common/utils/error-handler.util';
import {
  ResourceNotFoundException,
  ConflictException,
  ExternalServiceException,
} from '../../../common/exceptions/custom-exceptions';

@Injectable()
export class WhatsAppConfigService {
  private readonly logger = new Logger(WhatsAppConfigService.name);

  constructor(
    @InjectRepository(WhatsAppConfig)
    private whatsappConfigRepository: Repository<WhatsAppConfig>,
    private metaApiService: MetaApiService,
  ) {}

  async findByTenantId(tenantId: string): Promise<WhatsAppConfig | null> {
    return this.whatsappConfigRepository.findOne({
      where: { tenantId },
    });
  }

  async create(
    tenantId: string,
    createDto: CreateWhatsAppConfigDto,
  ): Promise<WhatsAppConfig> {
    try {
      const existingConfig = await this.findByTenantId(tenantId);
      if (existingConfig) {
        throw new ConflictException(
          'WhatsApp configuration already exists for this tenant',
          { tenantId },
        );
      }

      const webhookSecret = createDto.webhookSecret || this.generateWebhookSecret();

      const config = this.whatsappConfigRepository.create({
        tenantId,
        ...createDto,
        webhookSecret,
        status: 'pending',
      });

      const savedConfig = await this.whatsappConfigRepository.save(config);
      this.logger.log(`Created WhatsApp config for tenant ${tenantId}`);
      
      return savedConfig;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      ErrorHandler.handleDatabaseError(error, 'create WhatsApp configuration');
    }
  }

  async update(
    tenantId: string,
    updateDto: UpdateWhatsAppConfigDto,
  ): Promise<WhatsAppConfig> {
    try {
      const config = await this.findByTenantId(tenantId);
      if (!config) {
        ErrorHandler.handleNotFound('WhatsApp configuration', tenantId);
      }

      if (updateDto.accessToken || updateDto.phoneNumberId) {
        config.status = 'pending';
      }

      Object.assign(config, updateDto);
      const updatedConfig = await this.whatsappConfigRepository.save(config);
      
      this.logger.log(`Updated WhatsApp config for tenant ${tenantId}`);
      return updatedConfig;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) throw error;
      ErrorHandler.handleDatabaseError(error, 'update WhatsApp configuration');
    }
  }

  async delete(tenantId: string): Promise<void> {
    try {
      const config = await this.findByTenantId(tenantId);
      if (!config) {
        ErrorHandler.handleNotFound('WhatsApp configuration', tenantId);
      }

      await this.whatsappConfigRepository.remove(config);
      this.logger.log(`Deleted WhatsApp config for tenant ${tenantId}`);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) throw error;
      ErrorHandler.handleDatabaseError(error, 'delete WhatsApp configuration');
    }
  }

  async testConnection(tenantId: string): Promise<{ success: boolean; message: string }> {
    const config = await this.findByTenantId(tenantId);
    if (!config) {
      ErrorHandler.handleNotFound('WhatsApp configuration', tenantId);
    }

    // MetaApiService.testConnection already handles errors and returns {success, message}
    const testResult = await this.metaApiService.testConnection(
      config.accessToken,
      config.phoneNumberId,
    );

    // Update config status based on test result
    config.status = testResult.success ? 'connected' : 'disconnected';
    config.lastTestedAt = new Date();
    config.testResult = testResult.message;
    
    try {
      await this.whatsappConfigRepository.save(config);
    } catch (error) {
      this.logger.error(`Failed to save test result for tenant ${tenantId}:`, error);
      // Don't fail the test if we can't save the result
    }

    this.logger.log(`Connection test for tenant ${tenantId}: ${testResult.success ? 'SUCCESS' : 'FAILED'} - ${testResult.message}`);
    
    return testResult;
  }

  async testConnectionWithData(accessToken: string, phoneNumberId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Testing connection with provided credentials for phone number ID: ${phoneNumberId}`);
    
    // MetaApiService.testConnection already handles errors and returns {success, message}
    const testResult = await this.metaApiService.testConnection(
      accessToken,
      phoneNumberId,
    );

    this.logger.log(`Connection test result: ${testResult.success ? 'SUCCESS' : 'FAILED'} - ${testResult.message}`);
    
    return testResult;
  }

  generateWebhookSecret(): string {
    return `whatsapp_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  }

  async regenerateWebhookSecret(tenantId: string): Promise<WhatsAppConfig> {
    try {
      const config = await this.findByTenantId(tenantId);
      if (!config) {
        ErrorHandler.handleNotFound('WhatsApp configuration', tenantId);
      }

      config.webhookSecret = this.generateWebhookSecret();
      const updatedConfig = await this.whatsappConfigRepository.save(config);
      
      this.logger.log(`Regenerated webhook secret for tenant ${tenantId}`);
      return updatedConfig;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) throw error;
      ErrorHandler.handleDatabaseError(error, 'regenerate webhook secret');
    }
  }
}

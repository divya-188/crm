import { Injectable, Logger, BadRequestException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { WhatsAppConfig } from '../../tenants/entities/whatsapp-config.entity';
import { Template } from '../entities/template.entity';

/**
 * Meta Template API Service
 * Handles communication with Meta's WhatsApp Business API for template management
 * 
 * API Documentation: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
 */
@Injectable()
export class MetaTemplateApiService {
  private readonly logger = new Logger(MetaTemplateApiService.name);
  private axiosInstance: AxiosInstance;
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(
    @InjectRepository(WhatsAppConfig)
    private whatsappConfigRepository: Repository<WhatsAppConfig>,
  ) {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Get active WhatsApp config for a tenant
   */
  private async getActiveConnection(tenantId: string): Promise<WhatsAppConfig> {
    this.logger.log(`🔍 Looking for WhatsApp config:`);
    this.logger.log(`   - Tenant ID: ${tenantId}`);
    
    // Try to find config with relaxed criteria
    let config = await this.whatsappConfigRepository.findOne({
      where: {
        tenantId,
        isActive: true,
        status: 'connected',
      },
    });

    // If not found with strict criteria, try just active
    if (!config) {
      this.logger.warn(`   ⚠️  No config with status='connected', trying isActive=true only`);
      config = await this.whatsappConfigRepository.findOne({
        where: {
          tenantId,
          isActive: true,
        },
      });
    }

    // If still not found, try ANY config
    if (!config) {
      this.logger.warn(`   ⚠️  No active config, trying ANY config for tenant`);
      config = await this.whatsappConfigRepository.findOne({
        where: { tenantId },
      });
    }

    this.logger.log(`   - Found: ${config ? 'YES ✅' : 'NO ❌'}`);
    
    if (!config) {
      this.logger.error(`   ❌ No WhatsApp config exists for tenant: ${tenantId}`);
      throw new BadRequestException(
        'No WhatsApp Business connection found. Please configure WhatsApp settings in your account first.',
      );
    }

    // Warn if config is not ideal
    if (config.status !== 'connected') {
      this.logger.warn(`   ⚠️  Using config with status: ${config.status} (not 'connected')`);
    }
    if (!config.isActive) {
      this.logger.warn(`   ⚠️  Using config with isActive: false`);
    }

    this.logger.log(`   - Config ID: ${config.id}`);
    this.logger.log(`   - Config Name: ${config.name}`);
    this.logger.log(`   - Business Account ID: ${config.businessAccountId || '❌ MISSING'}`);
    this.logger.log(`   - Access Token: ${config.accessToken ? '✅ Present' : '❌ MISSING'}`);

    if (!config.businessAccountId || !config.accessToken) {
      throw new BadRequestException(
        'WhatsApp connection is missing required credentials (Business Account ID or Access Token).',
      );
    }

    return config;
  }

  /**
   * Submit template to Meta for approval
   * @param tenantId Tenant ID
   * @param template Template to submit
   * @returns Meta API response with template ID
   */
  async submitTemplate(tenantId: string, template: Template): Promise<{
    id: string;
    status: string;
    category: string;
  }> {
    this.logger.log(`Submitting template ${template.name} to Meta for tenant ${tenantId}`);

    const connection = await this.getActiveConnection(tenantId);
    const payload = this.buildMetaTemplatePayload(template);

    try {
      const response = await this.axiosInstance.post(
        `/${connection.businessAccountId}/message_templates`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Enhanced logging to see full Meta response
      this.logger.log(`🚀 ===== META API RESPONSE =====`);
      this.logger.log(`📋 Template ID: ${response.data.id}`);
      this.logger.log(`📊 Status: ${response.data.status || 'PENDING'}`);
      this.logger.log(`📁 Category: ${response.data.category}`);
      this.logger.log(`🔍 Full Response from Meta:`);
      this.logger.log(JSON.stringify(response.data, null, 2));
      this.logger.log(`🚀 ===== END META RESPONSE =====`);
      
      return {
        id: response.data.id,
        status: response.data.status || 'PENDING',
        category: response.data.category,
      };
    } catch (error) {
      this.logger.error(`Failed to submit template to Meta: ${error.message}`);
      throw this.handleMetaApiError(error);
    }
  }

  /**
   * Get template status from Meta
   * @param tenantId Tenant ID
   * @param metaTemplateId Meta template ID
   * @returns Template status information
   */
  async getTemplateStatus(tenantId: string, metaTemplateId: string): Promise<{
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
    rejection_reason?: string;
  }> {
    this.logger.log(`Fetching template status from Meta: ${metaTemplateId}`);

    const connection = await this.getActiveConnection(tenantId);

    try {
      // Note: rejection_reason is only available for REJECTED templates
      // Requesting it for PENDING/APPROVED templates causes a 400 error
      const response = await this.axiosInstance.get(
        `/${metaTemplateId}`,
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
          params: {
            fields: 'id,name,status,category,language',
          },
        },
      );

      this.logger.log(`📊 Template status from Meta: ${response.data.status}`);

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch template status from Meta: ${error.message}`);
      throw this.handleMetaApiError(error);
    }
  }

  /**
   * Fetch all templates from Meta
   * @param tenantId Tenant ID
   * @returns List of templates from Meta
   */
  async fetchAllTemplatesFromMeta(tenantId: string): Promise<any[]> {
    this.logger.log(`📥 Fetching all templates from Meta for tenant: ${tenantId}`);

    const connection = await this.getActiveConnection(tenantId);

    try {
      const response = await this.axiosInstance.get(
        `/${connection.businessAccountId}/message_templates`,
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
          params: {
            // Note: rejection_reason is only available for REJECTED templates
            fields: 'id,name,status,category,language,components',
            limit: 100, // Max allowed by Meta
          },
        },
      );

      this.logger.log(`📊 Fetched ${response.data.data?.length || 0} templates from Meta`);
      this.logger.log(`🔍 Templates from Meta:`);
      this.logger.log(JSON.stringify(response.data.data, null, 2));
      
      return response.data.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch templates from Meta: ${error.message}`);
      throw this.handleMetaApiError(error);
    }
  }

  /**
   * Delete template from Meta
   * @param tenantId Tenant ID
   * @param metaTemplateName Template name in Meta
   * @returns Success status
   */
  async deleteTemplate(tenantId: string, metaTemplateName: string): Promise<{ success: boolean }> {
    this.logger.log(`Deleting template from Meta: ${metaTemplateName}`);

    const connection = await this.getActiveConnection(tenantId);

    try {
      const response = await this.axiosInstance.delete(
        `/${connection.businessAccountId}/message_templates`,
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
          params: {
            name: metaTemplateName,
          },
        },
      );

      this.logger.log(`Template deleted successfully from Meta`);
      return { success: response.data.success || true };
    } catch (error) {
      this.logger.error(`Failed to delete template from Meta: ${error.message}`);
      throw this.handleMetaApiError(error);
    }
  }

  /**
   * Build Meta API payload from template
   */
  private buildMetaTemplatePayload(template: Template): any {
    const payload: any = {
      name: template.name,
      language: template.language,
      category: this.mapCategoryToMeta(template.category),
      components: [],
    };

    // Add header component
    if (template.components?.header) {
      const header = template.components.header;
      const headerComponent: any = {
        type: 'HEADER',
      };

      if (header.type === 'TEXT') {
        headerComponent.format = 'TEXT';
        headerComponent.text = header.text;
      } else if (header.type === 'IMAGE') {
        headerComponent.format = 'IMAGE';
        if (header.mediaUrl) {
          headerComponent.example = {
            header_handle: [header.mediaUrl],
          };
        }
      } else if (header.type === 'VIDEO') {
        headerComponent.format = 'VIDEO';
        if (header.mediaUrl) {
          headerComponent.example = {
            header_handle: [header.mediaUrl],
          };
        }
      } else if (header.type === 'DOCUMENT') {
        headerComponent.format = 'DOCUMENT';
        if (header.mediaUrl) {
          headerComponent.example = {
            header_handle: [header.mediaUrl],
          };
        }
      }

      payload.components.push(headerComponent);
    }

    // Add body component (required)
    const bodyComponent: any = {
      type: 'BODY',
      text: template.components.body.text,
    };

    // Add examples for placeholders
    if (template.sampleValues && Object.keys(template.sampleValues).length > 0) {
      const examples = [];
      const placeholders = this.extractPlaceholders(template.components.body.text);
      
      placeholders.forEach((num) => {
        if (template.sampleValues[num.toString()]) {
          examples.push(template.sampleValues[num.toString()]);
        }
      });

      if (examples.length > 0) {
        bodyComponent.example = {
          body_text: [examples],
        };
      }
    }

    payload.components.push(bodyComponent);

    // Add footer component
    if (template.components?.footer?.text) {
      payload.components.push({
        type: 'FOOTER',
        text: template.components.footer.text,
      });
    }

    // Add buttons component
    if (template.components?.buttons && template.components.buttons.length > 0) {
      const buttonsComponent: any = {
        type: 'BUTTONS',
        buttons: [],
      };

      template.components.buttons.forEach((button) => {
        if (button.type === 'QUICK_REPLY') {
          buttonsComponent.buttons.push({
            type: 'QUICK_REPLY',
            text: button.text,
          });
        } else if (button.type === 'URL') {
          buttonsComponent.buttons.push({
            type: 'URL',
            text: button.text,
            url: button.url,
          });
        } else if (button.type === 'PHONE_NUMBER') {
          buttonsComponent.buttons.push({
            type: 'PHONE_NUMBER',
            text: button.text,
            phone_number: button.phoneNumber,
          });
        }
      });

      payload.components.push(buttonsComponent);
    }

    return payload;
  }

  /**
   * Map internal category to Meta category
   */
  private mapCategoryToMeta(category: string): string {
    const categoryMap: Record<string, string> = {
      TRANSACTIONAL: 'TRANSACTIONAL',
      UTILITY: 'UTILITY',
      MARKETING: 'MARKETING',
      ACCOUNT_UPDATE: 'ACCOUNT_UPDATE',
      OTP: 'AUTHENTICATION',
      // Legacy mappings
      utility: 'UTILITY',
      marketing: 'MARKETING',
      authentication: 'AUTHENTICATION',
    };

    return categoryMap[category] || 'UTILITY';
  }

  /**
   * Extract placeholder numbers from text
   */
  private extractPlaceholders(text: string): number[] {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = [...text.matchAll(regex)];
    return matches.map((m) => parseInt(m[1], 10)).sort((a, b) => a - b);
  }

  /**
   * Handle Meta API errors
   */
  private handleMetaApiError(error: any): HttpException {
    let errorMessage = 'Failed to communicate with Meta API';
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      const errorData = error.response.data;

      if (errorData?.error) {
        const metaError = errorData.error;
        errorMessage = metaError.message || metaError.error_user_msg || errorMessage;

        // Add error code if available
        if (metaError.code) {
          errorMessage = `[Meta Error ${metaError.code}] ${errorMessage}`;
        }

        // Add helpful hints for common errors
        if (metaError.code === 190) {
          errorMessage += ' - Invalid or expired access token. Please update your WhatsApp settings.';
        } else if (metaError.code === 100) {
          errorMessage += ' - Invalid parameter. Please check your template configuration.';
        } else if (metaError.code === 368) {
          errorMessage += ' - Template name already exists. Please use a different name.';
        } else if (metaError.code === 2388084) {
          errorMessage += ' - Template content violates WhatsApp policies. Please review and modify.';
        }

        // Include error subcode if available
        if (metaError.error_subcode) {
          errorMessage += ` (Subcode: ${metaError.error_subcode})`;
        }
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.logger.error(`Meta API Error: ${errorMessage}`);
    
    return new HttpException(
      {
        statusCode,
        message: errorMessage,
        error: 'Meta API Error',
        details: error.response?.data,
      },
      statusCode,
    );
  }
}

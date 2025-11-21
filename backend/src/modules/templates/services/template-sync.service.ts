import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template, TemplateStatus, TemplateCategoryType, TemplateStatusType } from '../entities/template.entity';
import { WhatsAppConfig } from '../../tenants/entities/whatsapp-config.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TemplateSyncService {
  private readonly logger = new Logger(TemplateSyncService.name);

  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
    @InjectRepository(WhatsAppConfig)
    private whatsappConfigRepository: Repository<WhatsAppConfig>,
    private configService: ConfigService,
  ) {}

  /**
   * Sync templates from Meta API for a tenant
   */
  async syncTemplatesFromMeta(tenantId: string): Promise<{
    created: number;
    updated: number;
    deleted: number;
    total: number;
  }> {
    this.logger.log(`Starting template sync for tenant ${tenantId}`);

    try {
      // Get WhatsApp config
      const config = await this.getWhatsAppConfig(tenantId);
      if (!config.accessToken || !config.businessAccountId) {
        throw new Error('WhatsApp configuration missing');
      }

      // Fetch templates from Meta API
      const metaTemplates = await this.fetchTemplatesFromMeta(
        config.accessToken,
        config.businessAccountId,
      );

      this.logger.log(`Fetched ${metaTemplates.length} templates from Meta`);

      // Get existing templates from database
      const existingTemplates = await this.templatesRepository.find({
        where: { tenantId },
      });

      const existingMetaIds = new Set(
        existingTemplates
          .filter((t) => t.metaTemplateId)
          .map((t) => t.metaTemplateId),
      );

      let created = 0;
      let updated = 0;
      let deleted = 0;

      // Process Meta templates
      for (const metaTemplate of metaTemplates) {
        const existing = existingTemplates.find(
          (t) => t.metaTemplateId === metaTemplate.id,
        );

        if (existing) {
          // Update existing template
          const hasChanges = this.hasTemplateChanged(existing, metaTemplate);
          if (hasChanges) {
            await this.updateTemplateFromMeta(existing, metaTemplate);
            updated++;
          }
        } else {
          // Create new template
          await this.createTemplateFromMeta(tenantId, metaTemplate);
          created++;
        }
      }

      // Mark deleted templates as inactive
      const metaTemplateIds = new Set(metaTemplates.map((t) => t.id));
      for (const existing of existingTemplates) {
        if (
          existing.metaTemplateId &&
          !metaTemplateIds.has(existing.metaTemplateId) &&
          existing.isActive
        ) {
          existing.isActive = false;
          await this.templatesRepository.save(existing);
          deleted++;
          this.logger.log(
            `Marked template ${existing.name} as inactive (deleted from Meta)`,
          );
        }
      }

      this.logger.log(
        `Sync completed: ${created} created, ${updated} updated, ${deleted} deleted`,
      );

      return {
        created,
        updated,
        deleted,
        total: metaTemplates.length,
      };
    } catch (error) {
      this.logger.error(`Template sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get WhatsApp configuration for tenant
   */
  private async getWhatsAppConfig(
    tenantId: string,
  ): Promise<{ accessToken: string; businessAccountId: string }> {
    // Try database first
    const config = await this.whatsappConfigRepository.findOne({
      where: { tenantId, isActive: true },
    });

    if (config) {
      return {
        accessToken: config.accessToken,
        businessAccountId: config.businessAccountId,
      };
    }

    // Fallback to environment variables
    return {
      accessToken: this.configService.get('WHATSAPP_ACCESS_TOKEN'),
      businessAccountId: this.configService.get(
        'WHATSAPP_BUSINESS_ACCOUNT_ID',
      ),
    };
  }

  /**
   * Fetch templates from Meta API
   */
  private async fetchTemplatesFromMeta(
    accessToken: string,
    businessAccountId: string,
  ): Promise<any[]> {
    const url = `https://graph.facebook.com/v18.0/${businessAccountId}/message_templates`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          limit: 1000, // Fetch all templates
        },
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch templates from Meta: ${error.message}`,
      );
      if (error.response) {
        this.logger.error(
          `Meta API Error: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Check if template has changed
   */
  private hasTemplateChanged(existing: Template, metaTemplate: any): boolean {
    // Check status change
    if (existing.status !== metaTemplate.status.toLowerCase()) {
      return true;
    }

    // Check if template was inactive and is now active
    if (!existing.isActive && metaTemplate.status !== 'DELETED') {
      return true;
    }

    return false;
  }

  /**
   * Create template from Meta data
   */
  private async createTemplateFromMeta(
    tenantId: string,
    metaTemplate: any,
  ): Promise<Template> {
    const components = this.parseMetaComponents(metaTemplate.components);

    const template = this.templatesRepository.create({
      tenantId,
      name: metaTemplate.name,
      displayName: metaTemplate.name,
      category: this.mapMetaCategory(metaTemplate.category),
      language: metaTemplate.language,
      description: `Synced from Meta: ${metaTemplate.name}`,
      components,
      sampleValues: this.extractSampleValues(metaTemplate.components),
      metaTemplateId: metaTemplate.id,
      metaTemplateName: metaTemplate.name,
      status: this.mapMetaStatus(metaTemplate.status),
      isActive: true,
      approvedAt:
        metaTemplate.status === 'APPROVED' ? new Date() : null,
    });

    const saved = await this.templatesRepository.save(template);
    this.logger.log(`Created template: ${saved.name} (${saved.id})`);
    return saved;
  }

  /**
   * Update template from Meta data
   */
  private async updateTemplateFromMeta(
    existing: Template,
    metaTemplate: any,
  ): Promise<Template> {
    existing.status = this.mapMetaStatus(metaTemplate.status);
    existing.isActive = metaTemplate.status !== 'DELETED';

    if (metaTemplate.status === 'APPROVED' && !existing.approvedAt) {
      existing.approvedAt = new Date();
    }

    if (metaTemplate.status === 'REJECTED') {
      existing.rejectedAt = new Date();
      existing.rejectionReason =
        metaTemplate.rejected_reason || 'Rejected by Meta';
    }

    const saved = await this.templatesRepository.save(existing);
    this.logger.log(`Updated template: ${existing.name} (${existing.id})`);
    return saved;
  }

  /**
   * Parse Meta components to our format
   */
  private parseMetaComponents(metaComponents: any[]): any {
    const components: any = {};

    if (!metaComponents) return components;

    for (const component of metaComponents) {
      if (component.type === 'HEADER') {
        components.header = {
          type: component.format || 'TEXT',
          text: component.text || '',
        };
      } else if (component.type === 'BODY') {
        const placeholders = [];
        const text = component.text || '';

        // Extract placeholders from text
        const matches = text.match(/\{\{(\d+)\}\}/g);
        if (matches) {
          matches.forEach((match, index) => {
            const placeholderIndex = parseInt(match.replace(/\{\{|\}\}/g, ''));
            placeholders.push({
              index: placeholderIndex,
              example: component.example?.body_text?.[0]?.[index] || `Value ${placeholderIndex}`,
            });
          });
        }

        components.body = {
          text,
          placeholders,
        };
      } else if (component.type === 'FOOTER') {
        components.footer = {
          text: component.text || '',
        };
      } else if (component.type === 'BUTTONS') {
        components.buttons = component.buttons?.map((btn: any) => ({
          type: btn.type,
          text: btn.text,
          url: btn.url,
          phoneNumber: btn.phone_number,
        }));
      }
    }

    return components;
  }

  /**
   * Extract sample values from Meta components
   */
  private extractSampleValues(metaComponents: any[]): Record<string, string> {
    const sampleValues: Record<string, string> = {};

    if (!metaComponents) return sampleValues;

    for (const component of metaComponents) {
      if (component.type === 'BODY' && component.example?.body_text) {
        component.example.body_text[0]?.forEach(
          (value: string, index: number) => {
            sampleValues[(index + 1).toString()] = value;
          },
        );
      }
    }

    return sampleValues;
  }

  /**
   * Map Meta category to our category
   */
  private mapMetaCategory(metaCategory: string): TemplateCategoryType {
    const categoryMap: Record<string, TemplateCategoryType> = {
      UTILITY: 'utility' as TemplateCategoryType,
      MARKETING: 'marketing' as TemplateCategoryType,
      AUTHENTICATION: 'authentication' as TemplateCategoryType,
      TRANSACTIONAL: 'utility' as TemplateCategoryType,
      ACCOUNT_UPDATE: 'utility' as TemplateCategoryType,
      OTP: 'authentication' as TemplateCategoryType,
    };

    return categoryMap[metaCategory] || ('utility' as TemplateCategoryType);
  }

  /**
   * Map Meta status to our status
   */
  private mapMetaStatus(metaStatus: string): TemplateStatusType {
    const statusMap: Record<string, TemplateStatusType> = {
      APPROVED: TemplateStatus.APPROVED,
      PENDING: TemplateStatus.PENDING,
      REJECTED: TemplateStatus.REJECTED,
      DELETED: TemplateStatus.DRAFT, // Mark as draft if deleted
    };

    return statusMap[metaStatus] || TemplateStatus.DRAFT;
  }
}

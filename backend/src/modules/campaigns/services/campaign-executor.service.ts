import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from '../entities/campaign.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Template } from '../../templates/entities/template.entity';
import { WhatsAppConfig } from '../../tenants/entities/whatsapp-config.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CampaignExecutorService {
  private readonly logger = new Logger(CampaignExecutorService.name);

  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
    @InjectRepository(WhatsAppConfig)
    private whatsappConfigRepository: Repository<WhatsAppConfig>,
    private configService: ConfigService,
  ) {}

  /**
   * Execute a campaign - send messages to all recipients
   */
  async executeCampaign(campaignId: string): Promise<void> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id: campaignId },
      relations: ['template'],
    });

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new Error(`Campaign ${campaignId} is not in running state`);
    }

    this.logger.log(`Starting execution of campaign: ${campaign.name} (${campaign.id})`);

    try {
      // Get recipients
      const recipients = await this.getRecipients(campaign);
      this.logger.log(`Found ${recipients.length} recipients for campaign ${campaign.id}`);

      // Send messages to each recipient
      let sentCount = 0;
      let deliveredCount = 0;
      let failedCount = 0;

      for (const contact of recipients) {
        try {
          await this.sendMessage(campaign, contact);
          sentCount++;
          deliveredCount++; // Assume delivered for now (webhook will update later)
          this.logger.log(`Message sent to ${contact.phone}`);
        } catch (error) {
          failedCount++;
          this.logger.error(`Failed to send message to ${contact.phone}:`, error.message);
        }

        // Update campaign stats periodically
        if (sentCount % 10 === 0) {
          await this.updateCampaignStats(campaign.id, sentCount, deliveredCount, failedCount);
        }
      }

      // Final update
      await this.updateCampaignStats(campaign.id, sentCount, deliveredCount, failedCount);

      // Mark campaign as completed
      await this.campaignsRepository.update(campaign.id, {
        status: CampaignStatus.COMPLETED,
        completedAt: new Date(),
      });

      this.logger.log(`Campaign ${campaign.id} completed. Sent: ${sentCount}, Failed: ${failedCount}`);
    } catch (error) {
      this.logger.error(`Campaign ${campaign.id} failed:`, error);
      await this.campaignsRepository.update(campaign.id, {
        status: CampaignStatus.FAILED,
        errorMessage: error.message,
      });
    }
  }

  /**
   * Send a single WhatsApp message
   */
  private async sendMessage(campaign: Campaign, contact: Contact): Promise<void> {
    // Try to get WhatsApp config from database first (tenant-specific)
    let accessToken: string;
    let phoneNumberId: string;
    let configSource: string;

    const whatsappConfig = await this.whatsappConfigRepository.findOne({
      where: { 
        tenantId: campaign.tenantId,
        isActive: true,
      },
    });

    if (whatsappConfig) {
      accessToken = whatsappConfig.accessToken;
      phoneNumberId = whatsappConfig.phoneNumberId;
      configSource = 'database (tenant-specific)';
      this.logger.debug(`Using WhatsApp config from database for tenant ${campaign.tenantId}`);
    } else {
      // Fallback to environment variables
      accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
      phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');
      configSource = 'environment variables';
      this.logger.debug(`Using WhatsApp config from environment variables`);
    }

    // Enhanced logging for debugging
    this.logger.debug(`WhatsApp Config Check:`);
    this.logger.debug(`- Config Source: ${configSource}`);
    this.logger.debug(`- Tenant ID: ${campaign.tenantId}`);
    this.logger.debug(`- Access Token: ${accessToken ? `${accessToken.substring(0, 20)}...` : 'MISSING'}`);
    this.logger.debug(`- Phone Number ID: ${phoneNumberId || 'MISSING'}`);

    if (!accessToken || !phoneNumberId) {
      throw new Error(`WhatsApp configuration missing: accessToken or phoneNumberId not found (checked ${configSource})`);
    }

    // Prepare template parameters
    const parameters = this.prepareTemplateParameters(campaign, contact);

    // Send message via Meta API
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: contact.phone,
      type: 'template',
      template: {
        name: campaign.template.metaTemplateName || campaign.template.name,
        language: {
          code: campaign.template.language,
        },
        components: parameters,
      },
    };

    this.logger.debug(`Sending message to ${contact.phone}`);
    this.logger.debug(`Template: ${campaign.template.metaTemplateName || campaign.template.name}`);
    this.logger.debug(`Language: ${campaign.template.language}`);
    this.logger.debug(`URL: ${url}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`✅ Message sent to ${contact.phone}. Message ID: ${response.data.messages[0].id}`);
    } catch (error) {
      // Enhanced error logging
      if (error.response) {
        this.logger.error(`❌ Meta API Error for ${contact.phone}:`);
        this.logger.error(`Status: ${error.response.status}`);
        this.logger.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
        this.logger.error(`Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
      } else if (error.request) {
        this.logger.error(`❌ No response received for ${contact.phone}`);
        this.logger.error(`Request: ${JSON.stringify(error.request, null, 2)}`);
      } else {
        this.logger.error(`❌ Error setting up request for ${contact.phone}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Prepare template parameters from variable mapping
   */
  private prepareTemplateParameters(campaign: Campaign, contact: Contact): any[] {
    const components = [];

    // Get template components
    const templateComponents = campaign.template.components;

    // Handle BODY component (only body has placeholders in our template structure)
    if (templateComponents?.body?.placeholders?.length > 0) {
      const bodyParams = templateComponents.body.placeholders.map((placeholder) => {
        const value = this.getVariableValue(campaign, contact, placeholder.index);
        return {
          type: 'text',
          text: value,
        };
      });

      components.push({
        type: 'body',
        parameters: bodyParams,
      });
    }

    return components;
  }

  /**
   * Get variable value from contact data
   */
  private getVariableValue(campaign: Campaign, contact: Contact, placeholderIndex: number): string {
    // Check if there's a variable mapping for this placeholder
    const mapping = campaign.variableMapping?.[placeholderIndex.toString()];

    if (mapping) {
      // Get value from contact field
      if (mapping === 'firstName') return contact.firstName || 'Customer';
      if (mapping === 'lastName') return contact.lastName || '';
      if (mapping === 'email') return contact.email || '';
      if (mapping === 'phone') return contact.phone || '';
      
      // Check custom fields
      if (contact.customFields?.[mapping]) {
        return contact.customFields[mapping];
      }
    }

    // Fallback to sample value from template
    return campaign.template.sampleValues?.[placeholderIndex.toString()] || `Value ${placeholderIndex}`;
  }

  /**
   * Get recipients for a campaign
   */
  private async getRecipients(campaign: Campaign): Promise<Contact[]> {
    const query = this.contactsRepository
      .createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId: campaign.tenantId })
      .andWhere('contact.isActive = :isActive', { isActive: true });

    // Apply segment filters
    if (campaign.segmentFilters) {
      Object.entries(campaign.segmentFilters).forEach(([key, value]) => {
        if (key === 'tags' && Array.isArray(value) && value.length > 0) {
          const tagConditions = value.map((tag, index) => {
            const paramName = `tag${index}`;
            query.setParameter(paramName, `%${tag}%`);
            return `contact.tags LIKE :${paramName}`;
          });
          query.andWhere(`(${tagConditions.join(' OR ')})`);
        } else if (key !== 'tags' && key !== 'customFields' && value !== undefined && value !== null) {
          query.andWhere(`contact.${key} = :${key}`, { [key]: value });
        }
      });
    }

    return query.getMany();
  }

  /**
   * Update campaign statistics
   */
  private async updateCampaignStats(
    campaignId: string,
    sentCount: number,
    deliveredCount: number,
    failedCount: number,
  ): Promise<void> {
    await this.campaignsRepository.update(campaignId, {
      sentCount,
      deliveredCount,
      failedCount,
    });
  }
}

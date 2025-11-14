import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { Contact } from '../contacts/entities/contact.entity';
import { Template, TemplateStatus } from '../templates/entities/template.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
  ) {}

  async create(tenantId: string, createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    // Validate template exists and is approved
    const template = await this.templatesRepository.findOne({
      where: { id: createCampaignDto.templateId, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.status !== TemplateStatus.APPROVED) {
      throw new BadRequestException('Only approved templates can be used in campaigns');
    }

    // Count recipients based on segment criteria
    const recipientCount = await this.countRecipients(tenantId, createCampaignDto.segmentCriteria);

    const campaign = this.campaignsRepository.create({
      name: createCampaignDto.name,
      templateId: createCampaignDto.templateId,
      segmentFilters: createCampaignDto.segmentCriteria, // Store as segmentFilters in DB
      variableMapping: createCampaignDto.variableMapping,
      tenantId,
      totalRecipients: recipientCount,
      scheduledAt: createCampaignDto.scheduledAt ? new Date(createCampaignDto.scheduledAt) : null,
    });

    return this.campaignsRepository.save(campaign);
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<{ data: Campaign[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    
    const query = this.campaignsRepository.createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.template', 'template')
      .where('campaign.tenantId = :tenantId', { tenantId });

    if (status) {
      query.andWhere('campaign.status = :status', { status });
    }

    const [data, total] = await query
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy('campaign.createdAt', 'DESC')
      .getManyAndCount();

    const hasMore = pageNum * limitNum < total;

    return { data, total, page: pageNum, limit: limitNum, hasMore };
  }

  async findOne(tenantId: string, id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id, tenantId },
      relations: ['template'],
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async update(tenantId: string, id: string, updateData: Partial<CreateCampaignDto>): Promise<Campaign> {
    const campaign = await this.findOne(tenantId, id);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be updated');
    }

    if (updateData.segmentCriteria) {
      const recipientCount = await this.countRecipients(tenantId, updateData.segmentCriteria);
      campaign.totalRecipients = recipientCount;
      campaign.segmentFilters = updateData.segmentCriteria; // Update segmentFilters in DB
    }

    Object.assign(campaign, updateData);
    return this.campaignsRepository.save(campaign);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const campaign = await this.findOne(tenantId, id);

    if (campaign.status === CampaignStatus.RUNNING) {
      throw new BadRequestException('Cannot delete running campaign');
    }

    await this.campaignsRepository.delete({ id, tenantId });
  }

  async schedule(tenantId: string, id: string, scheduledAt: Date): Promise<Campaign> {
    const campaign = await this.findOne(tenantId, id);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be scheduled');
    }

    campaign.status = CampaignStatus.SCHEDULED;
    campaign.scheduledAt = scheduledAt;

    return this.campaignsRepository.save(campaign);
  }

  async start(tenantId: string, id: string): Promise<Campaign> {
    const campaign = await this.findOne(tenantId, id);

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new BadRequestException('Campaign cannot be started');
    }

    campaign.status = CampaignStatus.RUNNING;
    campaign.startedAt = new Date();

    return this.campaignsRepository.save(campaign);
  }

  async pause(tenantId: string, id: string): Promise<Campaign> {
    const campaign = await this.findOne(tenantId, id);

    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new BadRequestException('Only running campaigns can be paused');
    }

    campaign.status = CampaignStatus.PAUSED;

    return this.campaignsRepository.save(campaign);
  }

  async resume(tenantId: string, id: string): Promise<Campaign> {
    const campaign = await this.findOne(tenantId, id);

    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new BadRequestException('Only paused campaigns can be resumed');
    }

    campaign.status = CampaignStatus.RUNNING;

    return this.campaignsRepository.save(campaign);
  }

  async getRecipients(tenantId: string, id: string): Promise<Contact[]> {
    const campaign = await this.findOne(tenantId, id);

    const query = this.contactsRepository.createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId });

    // Apply segment filters
    Object.entries(campaign.segmentFilters).forEach(([key, value]) => {
      if (key === 'tags' && Array.isArray(value)) {
        query.andWhere('contact.tags && :tags', { tags: value });
      } else if (value !== undefined && value !== null) {
        query.andWhere(`contact.${key} = :${key}`, { [key]: value });
      }
    });

    return query.getMany();
  }

  async getStats(tenantId: string, id: string): Promise<any> {
    const campaign = await this.findOne(tenantId, id);

    return {
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      readCount: campaign.readCount,
      failedCount: campaign.failedCount,
      deliveryRate: campaign.totalRecipients > 0 
        ? (campaign.deliveredCount / campaign.totalRecipients * 100).toFixed(2) 
        : 0,
      readRate: campaign.deliveredCount > 0 
        ? (campaign.readCount / campaign.deliveredCount * 100).toFixed(2) 
        : 0,
    };
  }

  async duplicate(tenantId: string, id: string): Promise<Campaign> {
    const originalCampaign = await this.findOne(tenantId, id);

    const duplicatedCampaign = this.campaignsRepository.create({
      name: `${originalCampaign.name} (Copy)`,
      templateId: originalCampaign.templateId,
      segmentFilters: originalCampaign.segmentFilters,
      tenantId,
      totalRecipients: originalCampaign.totalRecipients,
      status: CampaignStatus.DRAFT,
    });

    return this.campaignsRepository.save(duplicatedCampaign);
  }

  async getMessages(
    tenantId: string,
    id: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const campaign = await this.findOne(tenantId, id);
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    // For now, return mock data since we don't have campaign_messages table yet
    // This will be implemented when task 13 (campaign execution worker) is done
    const mockMessages = Array.from({ length: Math.min(limitNum, campaign.totalRecipients) }, (_, i) => ({
      id: `msg-${i + 1}`,
      contact: {
        name: `Contact ${i + 1}`,
        phoneNumber: `+1234567${String(i).padStart(4, '0')}`,
      },
      status: ['sent', 'delivered', 'read', 'failed', 'pending'][Math.floor(Math.random() * 5)],
      sentAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      failureReason: Math.random() > 0.8 ? 'Invalid phone number' : null,
    }));

    const hasMore = pageNum * limitNum < campaign.totalRecipients;

    return {
      data: mockMessages,
      total: campaign.totalRecipients,
      page: pageNum,
      limit: limitNum,
      hasMore,
    };
  }

  private async countRecipients(tenantId: string, filters: Record<string, any>): Promise<number> {
    const query = this.contactsRepository.createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId });

    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'tags' && Array.isArray(value)) {
        query.andWhere('contact.tags && :tags', { tags: value });
      } else if (value !== undefined && value !== null) {
        query.andWhere(`contact.${key} = :${key}`, { [key]: value });
      }
    });

    return query.getCount();
  }
}

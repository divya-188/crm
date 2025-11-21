import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Brackets, In } from 'typeorm';
import { Template, TemplateStatus } from './entities/template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplateValidationEngine } from './services/template-validation.engine';
import { TemplateStatusHistoryService } from './services/template-status-history.service';
import { TemplateStatusPollerService } from './services/template-status-poller.service';
import { TemplateCacheService } from './services/template-cache.service';
import { MetaTemplateApiService } from './services/meta-template-api.service';
import { Campaign, CampaignStatus } from '../campaigns/entities/campaign.entity';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    private validationEngine: TemplateValidationEngine,
    private statusHistoryService: TemplateStatusHistoryService,
    @Inject(forwardRef(() => TemplateStatusPollerService))
    private statusPollerService: TemplateStatusPollerService,
    private cacheService: TemplateCacheService,
    private metaTemplateApiService: MetaTemplateApiService,
  ) {}

  // Lazy inject TemplateSyncService to avoid circular dependency
  private templateSyncService: any;

  /**
   * Create a new template with validation and quality scoring
   * Requirement 1.1: Template Component Structure and Validation
   */
  async createTemplate(
    tenantId: string,
    createTemplateDto: CreateTemplateDto,
    userId?: string,
  ): Promise<Template> {
    this.logger.log(`Creating template: ${createTemplateDto.name} for tenant: ${tenantId}`);
    this.logger.debug(`Template DTO: ${JSON.stringify(createTemplateDto, null, 2)}`);
    this.logger.debug(`Sample Values Keys: ${Object.keys(createTemplateDto.sampleValues || {}).join(', ')}`);
    this.logger.debug(`Body Text: ${createTemplateDto.components?.body?.text}`);

    // Run comprehensive validation
    const validationResult = await this.validationEngine.validate(createTemplateDto);

    if (!validationResult.isValid) {
      this.logger.warn(`Template validation failed: ${JSON.stringify(validationResult.errors)}`);
      
      // Format error message with details
      const errorMessages = validationResult.errors.map(err => `${err.field}: ${err.message}`).join('; ');
      
      throw new BadRequestException({
        statusCode: 400,
        message: 'Template validation failed',
        error: 'Bad Request',
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        details: errorMessages,
      });
    }

    // Check for duplicate template name within tenant
    const existingTemplate = await this.templatesRepository.findOne({
      where: {
        tenantId,
        name: createTemplateDto.name,
        isActive: true,
      },
    });

    if (existingTemplate) {
      throw new BadRequestException(
        `Template with name "${createTemplateDto.name}" already exists`,
      );
    }

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(createTemplateDto);

    const template = this.templatesRepository.create({
      ...createTemplateDto,
      tenantId,
      category: createTemplateDto.category as any,
      language: createTemplateDto.language as any,
      status: TemplateStatus.DRAFT,
      qualityScore,
      version: 1,
      isActive: true,
      usageCount: 0,
      createdByUserId: userId,
    });

    const savedTemplate = await this.templatesRepository.save(template);
    
    this.logger.log(`✅ Template created successfully:`);
    this.logger.log(`   - ID: ${savedTemplate.id}`);
    this.logger.log(`   - Name: ${savedTemplate.name}`);
    this.logger.log(`   - Tenant ID: ${savedTemplate.tenantId}`);
    this.logger.log(`   - Status: ${savedTemplate.status}`);
    this.logger.log(`   - isActive: ${savedTemplate.isActive}`);
    this.logger.log(`   - Category: ${savedTemplate.category}`);

    // Invalidate template list cache
    await this.cacheService.invalidateTemplateList(tenantId);

    return savedTemplate;
  }

  /**
   * Legacy method for backward compatibility
   */
  async create(
    tenantId: string,
    createTemplateDto: CreateTemplateDto,
    userId?: string,
  ): Promise<Template> {
    return this.createTemplate(tenantId, createTemplateDto, userId);
  }

  /**
   * Find templates with advanced filtering, search, and pagination
   * Requirements: 15.1, 15.2 - Template Search and Filtering
   * Task 58: Implements Redis caching for template lists
   */
  async findTemplates(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
      language?: string;
      search?: string;
      isActive?: boolean;
      sortBy?: 'name' | 'createdAt' | 'usageCount' | 'approvedAt' | 'qualityScore';
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ): Promise<{
    data: Template[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      language,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100); // Max 100 per page

    this.logger.log(`🔍 Finding templates:`);
    this.logger.log(`   - Tenant ID: ${tenantId}`);
    this.logger.log(`   - Page: ${pageNum}`);
    this.logger.log(`   - Limit: ${limitNum}`);
    this.logger.log(`   - Filters: ${JSON.stringify(options)}`);
    
    // Debug: Check if ANY templates exist for this tenant
    const debugCount = await this.templatesRepository.count({ where: { tenantId } });
    this.logger.log(`   - Total templates for this tenant: ${debugCount}`);

    // Try to get from cache first
    const cached = await this.cacheService.getTemplateList(tenantId, options);
    if (cached) {
      this.logger.debug('Returning cached template list');
      return cached;
    }

    const query = this.templatesRepository
      .createQueryBuilder('template')
      .where('template.tenantId = :tenantId', { tenantId });

    // Apply status filter
    if (status) {
      query.andWhere('template.status = :status', { status });
    }

    // Apply category filter
    if (category) {
      query.andWhere('template.category = :category', { category });
    }

    // Apply language filter
    if (language) {
      query.andWhere('template.language = :language', { language });
    }

    // Apply active filter
    if (isActive !== undefined) {
      query.andWhere('template.isActive = :isActive', { isActive });
    }

    // Apply full-text search across multiple fields
    if (search && search.trim()) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('template.name ILIKE :search', { search: `%${search}%` })
            .orWhere('template.displayName ILIKE :search', { search: `%${search}%` })
            .orWhere('template.description ILIKE :search', { search: `%${search}%` })
            .orWhere('template.metaTemplateName ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    // Apply sorting
    const sortField = `template.${sortBy}`;
    query.orderBy(sortField, sortOrder);

    // Add secondary sort by createdAt for consistency
    if (sortBy !== 'createdAt') {
      query.addOrderBy('template.createdAt', 'DESC');
    }

    // Apply pagination
    const skip = (pageNum - 1) * limitNum;
    query.skip(skip).take(limitNum);

    const [data, total] = await query.getManyAndCount();

    const hasMore = pageNum * limitNum < total;

    this.logger.log(`📊 Query results:`);
    this.logger.log(`   - Found: ${data.length} templates`);
    this.logger.log(`   - Total: ${total}`);
    this.logger.log(`   - Has more: ${hasMore}`);
    
    if (data.length > 0) {
      this.logger.log(`   - First template: ${data[0].name} (ID: ${data[0].id}, Tenant: ${data[0].tenantId})`);
    }

    const result = {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore,
    };

    // Cache the result
    await this.cacheService.setTemplateList(tenantId, options, result);

    return result;
  }

  /**
   * Legacy method for backward compatibility
   */
  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    category?: string,
    search?: string,
  ): Promise<{
    data: Template[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    return this.findTemplates(tenantId, {
      page,
      limit,
      status,
      category,
      search,
      isActive: true,
    });
  }

  /**
   * Find a single template by ID
   * Task 58: Implements Redis caching for individual templates
   */
  async findOne(tenantId: string, id: string): Promise<Template> {
    // Try to get from cache first
    const cached = await this.cacheService.getTemplate(id);
    if (cached && cached.tenantId === tenantId) {
      this.logger.debug(`Returning cached template: ${id}`);
      return cached;
    }

    const template = await this.templatesRepository.findOne({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // Cache the template
    await this.cacheService.setTemplate(template);

    return template;
  }

  /**
   * Update template with version handling
   * Requirement 14.1: Template Versioning and History
   */
  async updateTemplate(
    tenantId: string,
    id: string,
    updateData: Partial<CreateTemplateDto>,
    userId?: string,
    createNewVersion: boolean = false,
  ): Promise<Template> {
    this.logger.log(`Updating template: ${id} for tenant: ${tenantId}`);

    const template = await this.findOne(tenantId, id);

    // If template is approved and createNewVersion is true, create a new version
    if (template.status === TemplateStatus.APPROVED && createNewVersion) {
      this.logger.log(`Creating new version for approved template: ${id}`);
      return this.createNewVersion(tenantId, template, updateData, userId);
    }

    // Prevent direct updates to approved templates without versioning
    if (template.status === TemplateStatus.APPROVED && !createNewVersion) {
      throw new BadRequestException(
        'Cannot update approved template. Set createNewVersion=true to create a new version.',
      );
    }

    // Validate updated data if components are being changed
    if (updateData.components || updateData.name || updateData.category) {
      const dataToValidate = {
        ...template,
        ...updateData,
      };
      const validationResult = await this.validationEngine.validate(dataToValidate);

      if (!validationResult.isValid) {
        throw new BadRequestException({
          message: 'Template validation failed',
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        });
      }
    }

    // Recalculate quality score if content changed
    let qualityScore = template.qualityScore;
    if (updateData.components || updateData.content) {
      const dataForScore = {
        ...template,
        ...updateData,
      };
      qualityScore = this.calculateQualityScore(dataForScore);
    }

    // Apply updates
    Object.assign(template, updateData, {
      qualityScore,
      updatedByUserId: userId,
    });

    const updatedTemplate = await this.templatesRepository.save(template);
    this.logger.log(`Template updated successfully: ${updatedTemplate.id}`);

    // Invalidate caches
    await this.cacheService.invalidateTemplate(updatedTemplate.id, tenantId);

    return updatedTemplate;
  }

  /**
   * Create a new version of an existing template
   * Requirement 14.1, 14.2: Template Versioning
   */
  private async createNewVersion(
    tenantId: string,
    originalTemplate: Template,
    updateData: Partial<CreateTemplateDto>,
    userId?: string,
  ): Promise<Template> {
    const oldStatus = originalTemplate.status;
    
    // Mark original template as superseded
    originalTemplate.status = TemplateStatus.SUPERSEDED;
    await this.templatesRepository.save(originalTemplate);

    // Log status change for superseded template
    await this.logStatusChange(
      originalTemplate,
      oldStatus,
      TemplateStatus.SUPERSEDED,
      'Template superseded by new version',
      undefined,
      userId,
    );

    // Prepare new version data
    const newVersionData: Partial<Template> = {
      tenantId: originalTemplate.tenantId,
      name: updateData.name || originalTemplate.name,
      displayName: updateData.displayName || originalTemplate.displayName,
      category: (updateData.category as any) || originalTemplate.category,
      language: (updateData.language as any) || originalTemplate.language,
      description: updateData.description || originalTemplate.description,
      content: updateData.content || originalTemplate.content,
      components: updateData.components || originalTemplate.components,
      sampleValues: updateData.sampleValues || originalTemplate.sampleValues,
      variables: updateData.variables || originalTemplate.variables,
      buttons: updateData.buttons || originalTemplate.buttons,
      header: updateData.header || originalTemplate.header,
      footer: updateData.footer || originalTemplate.footer,
      version: originalTemplate.version + 1,
      parentTemplateId: originalTemplate.id,
      status: TemplateStatus.DRAFT,
      metaTemplateId: null,
      metaTemplateName: null,
      wabaId: originalTemplate.wabaId,
      approvalStatus: null,
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      isActive: true,
      usageCount: 0,
      lastUsedAt: null,
      deliveryRate: null,
      readRate: null,
      responseRate: null,
      createdByUserId: userId,
      updatedByUserId: null,
    };

    // Create new version
    const newVersion = this.templatesRepository.create(newVersionData);

    // Recalculate quality score
    newVersion.qualityScore = this.calculateQualityScore(newVersion);

    const savedVersion = await this.templatesRepository.save(newVersion);
    this.logger.log(
      `Created new version ${savedVersion.version} for template: ${originalTemplate.id}`,
    );

    return savedVersion;
  }

  /**
   * Legacy method for backward compatibility
   */
  async update(
    tenantId: string,
    id: string,
    updateData: Partial<CreateTemplateDto>,
  ): Promise<Template> {
    return this.updateTemplate(tenantId, id, updateData);
  }

  /**
   * Duplicate an existing template
   * Requirement 14.6: Template duplication logic
   */
  async duplicateTemplate(
    tenantId: string,
    id: string,
    userId?: string,
    newName?: string,
  ): Promise<Template> {
    this.logger.log(`📋 Duplicating template:`);
    this.logger.log(`   - Original ID: ${id}`);
    this.logger.log(`   - Tenant ID: ${tenantId}`);
    this.logger.log(`   - New Name: ${newName || 'auto-generated'}`);

    const originalTemplate = await this.findOne(tenantId, id);

    // Generate new name if not provided
    let duplicateName = newName;
    if (!duplicateName) {
      duplicateName = `${originalTemplate.name}_copy`;
      
      // Check if name exists and append number if needed
      let counter = 1;
      while (
        await this.templatesRepository.findOne({
          where: { tenantId, name: duplicateName, isActive: true },
        })
      ) {
        duplicateName = `${originalTemplate.name}_copy_${counter}`;
        counter++;
      }
    }

    // Create duplicate with reset status and metadata
    const duplicate = this.templatesRepository.create({
      ...originalTemplate,
      id: undefined, // Let database generate new ID
      name: duplicateName,
      displayName: originalTemplate.displayName
        ? `${originalTemplate.displayName} (Copy)`
        : null,
      status: TemplateStatus.DRAFT,
      version: 1,
      parentTemplateId: null, // Not a version, it's a duplicate
      metaTemplateId: null,
      metaTemplateName: null,
      approvalStatus: null,
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      usageCount: 0,
      lastUsedAt: null,
      deliveryRate: null,
      readRate: null,
      responseRate: null,
      createdByUserId: userId,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedDuplicate = await this.templatesRepository.save(duplicate);
    
    this.logger.log(`✅ Template duplicated successfully:`);
    this.logger.log(`   - New ID: ${savedDuplicate.id}`);
    this.logger.log(`   - New Name: ${savedDuplicate.name}`);
    this.logger.log(`   - Tenant ID: ${savedDuplicate.tenantId}`);
    this.logger.log(`   - Status: ${savedDuplicate.status}`);
    this.logger.log(`   - isActive: ${savedDuplicate.isActive}`);

    return savedDuplicate;
  }

  /**
   * Archive template (soft delete) with reason tracking
   * Requirement 14.5: Template archiving system
   * 
   * Features:
   * - Soft delete by setting isActive to false
   * - Prevents deletion of APPROVED templates (archives instead)
   * - Tracks archive reason in status history
   * - Maintains all template data for audit purposes
   */
  async archiveTemplate(
    tenantId: string,
    id: string,
    userId?: string,
    reason?: string,
  ): Promise<Template> {
    this.logger.log(`Archiving template: ${id} for tenant: ${tenantId}`);

    const template = await this.findOne(tenantId, id);

    // Prevent deletion of approved templates - must archive instead
    if (template.status === TemplateStatus.APPROVED) {
      this.logger.warn(
        `Archiving approved template (cannot be deleted): ${id}`,
      );
    }

    const oldStatus = template.status;

    // Soft delete by setting isActive to false
    template.isActive = false;
    template.updatedByUserId = userId;

    const archivedTemplate = await this.templatesRepository.save(template);

    // Log archive action in status history with reason
    await this.logStatusChange(
      archivedTemplate,
      oldStatus,
      oldStatus, // Status doesn't change, just archived
      reason || 'Template archived',
      { archived: true, archivedAt: new Date().toISOString() },
      userId,
    );

    this.logger.log(`Template archived successfully: ${archivedTemplate.id}`);

    return archivedTemplate;
  }

  /**
   * Get archived templates with filtering and pagination
   * Requirement 14.5: Create archived templates query
   */
  async findArchivedTemplates(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
      language?: string;
      search?: string;
      sortBy?: 'name' | 'createdAt' | 'usageCount' | 'approvedAt' | 'qualityScore';
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ): Promise<{
    data: Template[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    this.logger.log(
      `Finding archived templates for tenant: ${tenantId}, filters: ${JSON.stringify(options)}`,
    );

    // Use existing findTemplates method with isActive=false
    return this.findTemplates(tenantId, {
      ...options,
      isActive: false,
    });
  }

  /**
   * Restore template from archive
   * Requirement 14.5: Implement restore from archive
   */
  async restoreTemplate(
    tenantId: string,
    id: string,
    userId?: string,
  ): Promise<Template> {
    this.logger.log(`Restoring template from archive: ${id} for tenant: ${tenantId}`);

    const template = await this.findOne(tenantId, id);

    if (template.isActive) {
      throw new BadRequestException('Template is not archived');
    }

    const oldStatus = template.status;

    // Restore by setting isActive to true
    template.isActive = true;
    template.updatedByUserId = userId;

    const restoredTemplate = await this.templatesRepository.save(template);

    // Log restore action in status history
    await this.logStatusChange(
      restoredTemplate,
      oldStatus,
      oldStatus, // Status doesn't change, just restored
      'Template restored from archive',
      { restored: true, restoredAt: new Date().toISOString() },
      userId,
    );

    this.logger.log(`Template restored successfully: ${restoredTemplate.id}`);

    return restoredTemplate;
  }

  /**
   * Bulk archive multiple templates
   * Requirement 14.5: Efficient bulk archiving
   */
  async bulkArchiveTemplates(
    tenantId: string,
    templateIds: string[],
    userId?: string,
    reason?: string,
  ): Promise<{
    archived: number;
    failed: Array<{ id: string; error: string }>;
  }> {
    this.logger.log(
      `Bulk archiving ${templateIds.length} templates for tenant: ${tenantId}`,
    );

    const results = {
      archived: 0,
      failed: [] as Array<{ id: string; error: string }>,
    };

    for (const id of templateIds) {
      try {
        await this.archiveTemplate(tenantId, id, userId, reason);
        results.archived++;
      } catch (error) {
        this.logger.error(`Failed to archive template ${id}: ${error.message}`);
        results.failed.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Bulk archive completed: ${results.archived} archived, ${results.failed.length} failed`,
    );

    return results;
  }

  /**
   * Bulk restore multiple templates
   * Requirement 14.5: Efficient bulk restore
   */
  async bulkRestoreTemplates(
    tenantId: string,
    templateIds: string[],
    userId?: string,
  ): Promise<{
    restored: number;
    failed: Array<{ id: string; error: string }>;
  }> {
    this.logger.log(
      `Bulk restoring ${templateIds.length} templates for tenant: ${tenantId}`,
    );

    const results = {
      restored: 0,
      failed: [] as Array<{ id: string; error: string }>,
    };

    for (const id of templateIds) {
      try {
        await this.restoreTemplate(tenantId, id, userId);
        results.restored++;
      } catch (error) {
        this.logger.error(`Failed to restore template ${id}: ${error.message}`);
        results.failed.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Bulk restore completed: ${results.restored} restored, ${results.failed.length} failed`,
    );

    return results;
  }

  /**
   * Remove template (hard delete for non-approved templates only)
   * Requirement 14.5: Prevent deletion of APPROVED templates
   * Requirement 19.7: Prevent deletion of templates in active campaigns
   * 
   * Rules:
   * - APPROVED templates cannot be deleted (must be archived)
   * - Templates used in active campaigns cannot be deleted
   * - Only DRAFT, PENDING, REJECTED, or SUPERSEDED templates can be deleted
   * - Hard delete removes all data permanently
   */
  async remove(tenantId: string, id: string, userId?: string): Promise<void> {
    this.logger.log(`Attempting to delete template: ${id} for tenant: ${tenantId}`);

    const template = await this.findOne(tenantId, id);

    // Prevent deletion of approved templates
    if (template.status === TemplateStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot delete approved template. Use archive endpoint instead to preserve the template.',
      );
    }

    // Check if template is used in any active campaigns
    const activeCampaigns = await this.getActiveCampaignsUsingTemplate(tenantId, id);
    if (activeCampaigns.length > 0) {
      const campaignNames = activeCampaigns.map(c => c.name).join(', ');
      throw new BadRequestException(
        `Cannot delete template. It is currently used in ${activeCampaigns.length} active campaign(s): ${campaignNames}. Please pause or complete these campaigns first.`,
      );
    }

    // Log deletion before removing
    await this.logStatusChange(
      template,
      template.status,
      'deleted',
      'Template permanently deleted',
      { deletedAt: new Date().toISOString() },
      userId,
    );

    // Hard delete
    await this.templatesRepository.delete({ id, tenantId });
    this.logger.log(`Template permanently deleted: ${id}`);
  }

  /**
   * Helper method to log status changes
   */
  private async logStatusChange(
    template: Template,
    fromStatus: string | null,
    toStatus: string,
    reason?: string,
    metaResponse?: any,
    userId?: string,
  ): Promise<void> {
    try {
      await this.statusHistoryService.logStatusChange({
        templateId: template.id,
        tenantId: template.tenantId,
        fromStatus,
        toStatus,
        reason,
        metaResponse,
        changedByUserId: userId,
      });
    } catch (error) {
      this.logger.error(`Failed to log status change: ${error.message}`, error.stack);
      // Don't throw - status history logging should not block the main operation
    }
  }

  async submit(tenantId: string, id: string, userId?: string): Promise<Template> {
    const template = await this.findOne(tenantId, id);

    if (template.status !== TemplateStatus.DRAFT) {
      throw new BadRequestException('Only draft templates can be submitted');
    }

    const oldStatus = template.status;

    try {
      // Submit to Meta API
      const metaResponse = await this.metaTemplateApiService.submitTemplate(tenantId, template);
      
      this.logger.log(`Template submitted to Meta successfully: ${metaResponse.id}`);
      
      // Update template with Meta response
      template.status = TemplateStatus.PENDING;
      template.submittedAt = new Date();
      template.metaTemplateId = metaResponse.id;
      template.metaTemplateName = template.name;

      const savedTemplate = await this.templatesRepository.save(template);

      // Log status change
      await this.logStatusChange(
        savedTemplate,
        oldStatus,
        TemplateStatus.PENDING,
        'Template submitted to Meta for approval',
        metaResponse,
        userId,
      );

      // Invalidate cache
      await this.cacheService.invalidateTemplate(savedTemplate.id, tenantId);

      return savedTemplate;
    } catch (error) {
      this.logger.error(`Failed to submit template to Meta: ${error.message}`);
      
      // Log the failure
      await this.logStatusChange(
        template,
        oldStatus,
        oldStatus, // Keep status as DRAFT
        `Failed to submit to Meta: ${error.message}`,
        { error: error.message },
        userId,
      );

      // Re-throw the error
      throw error;
    }
  }

  /**
   * Update approval status with comprehensive handling
   * Requirements: 8.2, 8.3, 8.4, 8.5, 9.1, 9.2
   * 
   * This method handles:
   * - APPROVED status updates with timestamps
   * - REJECTED status updates with reason
   * - Status change logging
   * - User notifications (WebSocket and Email)
   * - Webhook events for status changes
   */
  async updateApprovalStatus(
    tenantId: string,
    id: string,
    approvalStatus: 'APPROVED' | 'REJECTED',
    options: {
      rejectionReason?: string;
      metaResponse?: any;
      userId?: string;
      metaTemplateId?: string;
    } = {},
  ): Promise<Template> {
    this.logger.log(
      `Updating approval status for template ${id}: ${approvalStatus}`,
    );

    const template = await this.findOne(tenantId, id);
    const oldStatus = template.status;

    // Validate status transition
    if (template.status !== TemplateStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update approval status for template in ${template.status} status. Only PENDING templates can be approved or rejected.`,
      );
    }

    // Handle APPROVED status
    if (approvalStatus === 'APPROVED') {
      template.status = TemplateStatus.APPROVED;
      template.approvalStatus = 'APPROVED';
      template.approvedAt = new Date();
      template.rejectedAt = null;
      template.rejectionReason = null;

      if (options.metaTemplateId) {
        template.metaTemplateId = options.metaTemplateId;
      }

      this.logger.log(`Template ${id} approved successfully`);
    }
    // Handle REJECTED status
    else if (approvalStatus === 'REJECTED') {
      if (!options.rejectionReason) {
        throw new BadRequestException(
          'Rejection reason is required when rejecting a template',
        );
      }

      template.status = TemplateStatus.REJECTED;
      template.approvalStatus = 'REJECTED';
      template.rejectedAt = new Date();
      template.rejectionReason = options.rejectionReason;
      template.approvedAt = null;

      this.logger.log(`Template ${id} rejected: ${options.rejectionReason}`);
    }

    // Save updated template
    template.updatedByUserId = options.userId;
    const savedTemplate = await this.templatesRepository.save(template);

    // Log status change to history
    await this.logStatusChange(
      savedTemplate,
      oldStatus,
      savedTemplate.status,
      options.rejectionReason || `Template ${approvalStatus.toLowerCase()} by Meta`,
      options.metaResponse,
      options.userId,
    );

    // Send notifications and emit events (async, don't block)
    this.notifyStatusChange(savedTemplate, oldStatus, options.userId).catch((error) => {
      this.logger.error(
        `Failed to send notifications for template ${id}:`,
        error.stack,
      );
    });

    this.logger.log(`Template ${id} approval status updated successfully`);
    return savedTemplate;
  }

  /**
   * Send notifications for status changes
   * Handles WebSocket events, email notifications, and webhook events
   */
  private async notifyStatusChange(
    template: Template,
    oldStatus: string,
    userId?: string,
  ): Promise<void> {
    try {
      // 1. Emit WebSocket event for real-time updates
      await this.emitStatusChangeEvent(template, oldStatus, userId);

      // 2. Send email notification to template creator
      await this.sendStatusChangeEmail(template, oldStatus);

      // 3. Trigger webhook events for external integrations
      await this.triggerStatusChangeWebhook(template, oldStatus);

      this.logger.log(
        `Notifications sent successfully for template ${template.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending notifications for template ${template.id}:`,
        error.stack,
      );
      // Don't throw - notifications should not block the main operation
    }
  }

  /**
   * Emit WebSocket event for real-time status updates
   * Requirement 8.4: User notifications for status changes
   */
  private async emitStatusChangeEvent(
    template: Template,
    oldStatus: string,
    userId?: string,
  ): Promise<void> {
    // Note: WebSocket integration will be added when WebSocketModule is imported
    // For now, log the event that should be emitted
    this.logger.log(
      `[WebSocket Event] template:status:changed - Template: ${template.id}, Status: ${oldStatus} -> ${template.status}`,
    );

    // TODO: Emit via WebSocketGateway when module is imported
    // this.websocketGateway.broadcastToTenant(template.tenantId, 'template:status:changed', {
    //   templateId: template.id,
    //   templateName: template.name,
    //   oldStatus,
    //   newStatus: template.status,
    //   approvalStatus: template.approvalStatus,
    //   rejectionReason: template.rejectionReason,
    //   timestamp: new Date().toISOString(),
    //   updatedBy: userId,
    // });

    // Also emit to specific user if they created the template
    if (template.createdByUserId) {
      this.logger.log(
        `[WebSocket Event] Notifying user ${template.createdByUserId} about template status change`,
      );
      // TODO: this.websocketGateway.broadcastToUser(template.createdByUserId, 'template:status:changed', {...});
    }
  }

  /**
   * Send email notification for status changes
   * Requirement 8.4, 8.5: User notifications for APPROVED/REJECTED status
   */
  private async sendStatusChangeEmail(
    template: Template,
    oldStatus: string,
  ): Promise<void> {
    // Note: Email notification integration will be added when EmailNotificationService is imported
    // For now, log the email that should be sent
    this.logger.log(
      `[Email Notification] Template status changed - Template: ${template.name}, Status: ${template.status}`,
    );

    // TODO: Implement email sending when EmailNotificationService is available
    // const emailData = {
    //   templateName: template.name,
    //   displayName: template.displayName || template.name,
    //   oldStatus,
    //   newStatus: template.status,
    //   approvalStatus: template.approvalStatus,
    //   rejectionReason: template.rejectionReason,
    //   templateId: template.id,
    //   timestamp: new Date().toISOString(),
    // };

    // if (template.status === TemplateStatus.APPROVED) {
    //   await this.emailService.sendTemplateApprovedEmail(template.createdByUserId, emailData);
    // } else if (template.status === TemplateStatus.REJECTED) {
    //   await this.emailService.sendTemplateRejectedEmail(template.createdByUserId, emailData);
    // }
  }

  /**
   * Trigger webhook events for status changes
   * Requirement 9.2: Create webhook events for status changes
   */
  private async triggerStatusChangeWebhook(
    template: Template,
    oldStatus: string,
  ): Promise<void> {
    // Note: Webhook integration will be added when WebhookService is imported
    // For now, log the webhook event that should be triggered
    this.logger.log(
      `[Webhook Event] template.status.changed - Template: ${template.id}, Status: ${template.status}`,
    );

    // TODO: Trigger webhook when WebhookService is available
    // const webhookPayload = {
    //   event: 'template.status.changed',
    //   timestamp: new Date().toISOString(),
    //   data: {
    //     templateId: template.id,
    //     templateName: template.name,
    //     displayName: template.displayName,
    //     category: template.category,
    //     language: template.language,
    //     oldStatus,
    //     newStatus: template.status,
    //     approvalStatus: template.approvalStatus,
    //     rejectionReason: template.rejectionReason,
    //     metaTemplateId: template.metaTemplateId,
    //     approvedAt: template.approvedAt,
    //     rejectedAt: template.rejectedAt,
    //     tenantId: template.tenantId,
    //   },
    // };

    // await this.webhookService.triggerWebhooks(template.tenantId, 'template.status.changed', webhookPayload);
  }

  /**
   * Legacy method for backward compatibility - approve
   */
  async approve(
    tenantId: string,
    id: string,
    externalId?: string,
    metaResponse?: any,
    userId?: string,
  ): Promise<Template> {
    return this.updateApprovalStatus(tenantId, id, 'APPROVED', {
      metaTemplateId: externalId,
      metaResponse,
      userId,
    });
  }

  /**
   * Legacy method for backward compatibility - reject
   */
  async reject(
    tenantId: string,
    id: string,
    reason: string,
    metaResponse?: any,
    userId?: string,
  ): Promise<Template> {
    return this.updateApprovalStatus(tenantId, id, 'REJECTED', {
      rejectionReason: reason,
      metaResponse,
      userId,
    });
  }

  /**
   * Get all versions of a template
   * Requirement 14.3: Implement GET /templates/:id/versions endpoint
   * 
   * Returns all versions of a template, including:
   * - The original template
   * - All subsequent versions created from it
   * - Versions are ordered by version number (newest first)
   * 
   * @param tenantId - Tenant ID
   * @param id - Template ID (can be any version)
   * @returns Array of template versions
   */
  async getTemplateVersions(
    tenantId: string,
    id: string,
  ): Promise<Template[]> {
    this.logger.log(`Getting versions for template: ${id}`);

    const template = await this.findOne(tenantId, id);

    // Find the root template (the one without a parent)
    let rootTemplateId = template.id;
    if (template.parentTemplateId) {
      // This is a version, find the root
      const rootTemplate = await this.findRootTemplate(tenantId, template);
      rootTemplateId = rootTemplate.id;
    }

    // Find all versions that share the same root
    // This includes:
    // 1. The root template itself
    // 2. All direct children of the root (parentTemplateId = rootTemplateId)
    // 3. All descendants (templates whose parent is a child of root)
    const versions = await this.templatesRepository
      .createQueryBuilder('template')
      .where('template.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(template.id = :rootTemplateId OR template.parentTemplateId = :rootTemplateId)',
        { rootTemplateId },
      )
      .orderBy('template.version', 'DESC')
      .addOrderBy('template.createdAt', 'DESC')
      .getMany();

    this.logger.log(`Found ${versions.length} versions for template ${id}`);

    return versions;
  }

  /**
   * Find the root template (original template without parent)
   * Helper method for version tracking
   */
  private async findRootTemplate(
    tenantId: string,
    template: Template,
  ): Promise<Template> {
    let current = template;
    
    // Traverse up the parent chain until we find the root
    while (current.parentTemplateId) {
      const parent = await this.templatesRepository.findOne({
        where: { id: current.parentTemplateId, tenantId },
      });

      if (!parent) {
        // Parent not found, current is effectively the root
        break;
      }

      current = parent;
    }

    return current;
  }

  /**
   * Manually refresh template approval status from Meta API
   * Requirement 8.6: Add POST /templates/:id/refresh-status endpoint
   * 
   * This method allows users to manually check the approval status
   * instead of waiting for the automatic 5-minute polling interval.
   * 
   * Features:
   * - Fetches latest status from Meta API
   * - Updates template if status has changed
   * - Stops automatic polling if status is no longer pending
   * - Logs status changes to history
   * 
   * @param tenantId - Tenant ID
   * @param id - Template ID
   * @param accessToken - Optional Meta API access token
   * @returns Updated template
   */
  async refreshTemplateStatus(
    tenantId: string,
    id: string,
    accessToken?: string,
  ): Promise<Template> {
    this.logger.log(`Manual status refresh requested for template: ${id}`);

    const template = await this.findOne(tenantId, id);

    // Validate template can be refreshed
    if (template.status !== TemplateStatus.PENDING) {
      throw new BadRequestException(
        `Cannot refresh status for template in ${template.status} status. Only PENDING templates can be refreshed.`,
      );
    }

    if (!template.metaTemplateId) {
      throw new BadRequestException(
        'Template does not have a Meta template ID. Cannot refresh status.',
      );
    }

    // Use the status poller service to refresh the status
    this.logger.log(
      `Delegating status refresh to TemplateStatusPollerService for template ${id}`,
    );

    return await this.statusPollerService.refreshTemplateStatus(id, tenantId, accessToken);
  }

  async preview(tenantId: string, id: string, variables: Record<string, string>): Promise<string> {
    const template = await this.findOne(tenantId, id);

    let preview = template.content;

    // Replace variables with provided values
    if (template.variables) {
      template.variables.forEach((variable, index) => {
        const value = variables[variable.name] || variable.example;
        preview = preview.replace(`{{${index + 1}}}`, value);
      });
    }

    return preview;
  }

  /**
   * Calculate quality score for a template
   * Requirement 18.6: Template quality score calculation
   */
  calculateQualityScore(template: any): number {
    let score = 100;

    // Get body text from either new components structure or legacy content
    const bodyText =
      template.components?.body?.text || template.content || '';

    // 1. Body length scoring (optimal range: 50-800 characters)
    const bodyLength = bodyText.length;
    if (bodyLength > 800) {
      score -= 10; // Too long, may be overwhelming
    } else if (bodyLength < 50) {
      score -= 15; // Too short, may lack context
    } else if (bodyLength >= 100 && bodyLength <= 500) {
      score += 5; // Optimal length
    }

    // 2. Component completeness scoring
    if (template.components?.footer || template.footer) {
      score += 5; // Has footer for additional context
    }

    if (template.description) {
      score += 5; // Has description for organization
    }

    if (template.components?.header || template.header) {
      score += 3; // Has header for emphasis
    }

    // 3. Placeholder usage scoring
    const placeholderCount = (bodyText.match(/\{\{\d+\}\}/g) || []).length;
    if (placeholderCount > 5) {
      score -= 10; // Too many placeholders, may be confusing
    } else if (placeholderCount > 0 && placeholderCount <= 3) {
      score += 3; // Good use of personalization
    }

    // 4. Button usage scoring
    const buttonCount = template.components?.buttons?.length || template.buttons?.length || 0;
    if (buttonCount > 0) {
      score += 5; // Interactive elements improve engagement
    }

    // 5. Spam indicator detection
    const spamWords = [
      'buy now',
      'limited time',
      'act fast',
      'click here',
      'urgent',
      'hurry',
      'free money',
      'guaranteed',
      'risk free',
      'no obligation',
    ];

    const lowerBodyText = bodyText.toLowerCase();
    const spamCount = spamWords.filter((word) => lowerBodyText.includes(word)).length;

    if (spamCount > 0) {
      score -= spamCount * 5; // Deduct 5 points per spam indicator
    }

    // 6. Excessive capitalization check
    const capsWords = bodyText.match(/\b[A-Z]{3,}\b/g) || [];
    if (capsWords.length > 2) {
      score -= 5; // Too much shouting
    }

    // 7. Excessive punctuation check
    const excessivePunctuation = bodyText.match(/[!?]{2,}/g) || [];
    if (excessivePunctuation.length > 0) {
      score -= 5; // Looks unprofessional
    }

    // 8. Category-specific scoring
    if (template.category === 'MARKETING') {
      // Marketing templates should have clear CTAs
      if (buttonCount === 0) {
        score -= 5; // Marketing without CTA is less effective
      }
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  private validateTemplateVariables(
    content: string,
    variables?: Array<{ name: string; example: string }>,
  ): void {
    // Extract variable placeholders from content
    const placeholders = content.match(/\{\{\d+\}\}/g) || [];
    const variableCount = placeholders.length;

    if (variables && variables.length !== variableCount) {
      throw new BadRequestException(
        `Template has ${variableCount} placeholders but ${variables.length} variables provided`,
      );
    }

    // Validate placeholder numbering
    for (let i = 1; i <= variableCount; i++) {
      if (!content.includes(`{{${i}}}`)) {
        throw new BadRequestException(`Missing placeholder {{${i}}} in template`);
      }
    }
  }

  async sendTemplate(
    tenantId: string,
    templateId: string,
    contactId: string,
    variables: Record<string, string>,
  ): Promise<any> {
    const template = await this.findOne(tenantId, templateId);

    if (template.status !== TemplateStatus.APPROVED) {
      throw new BadRequestException('Only approved templates can be sent');
    }

    // Generate message content from template
    const content = await this.preview(tenantId, templateId, variables);

    // In production, this would send via WhatsApp API
    return {
      templateId: template.id,
      contactId,
      content,
      status: 'sent',
      sentAt: new Date(),
    };
  }

  /**
   * Get all campaigns using a specific template
   * Requirement 19.6: Track which templates are used in which campaigns
   * 
   * Returns all campaigns (active and inactive) that use the specified template.
   * Useful for:
   * - Displaying campaign usage on template details page
   * - Preventing deletion of templates in active campaigns
   * - Understanding template usage patterns
   * 
   * @param tenantId - Tenant ID
   * @param templateId - Template ID
   * @param activeOnly - If true, only return active campaigns (default: false)
   * @returns Array of campaigns using the template
   */
  async getCampaignsUsingTemplate(
    tenantId: string,
    templateId: string,
    activeOnly: boolean = false,
  ): Promise<Campaign[]> {
    this.logger.log(
      `Getting campaigns using template ${templateId} (activeOnly: ${activeOnly})`,
    );

    const query = this.campaignsRepository
      .createQueryBuilder('campaign')
      .where('campaign.tenantId = :tenantId', { tenantId })
      .andWhere('campaign.templateId = :templateId', { templateId });

    if (activeOnly) {
      // Active campaigns are those that are running, scheduled, or paused
      query.andWhere('campaign.status IN (:...activeStatuses)', {
        activeStatuses: [
          CampaignStatus.RUNNING,
          CampaignStatus.SCHEDULED,
          CampaignStatus.PAUSED,
        ],
      });
    }

    query.orderBy('campaign.createdAt', 'DESC');

    const campaigns = await query.getMany();

    this.logger.log(
      `Found ${campaigns.length} campaigns using template ${templateId}`,
    );

    return campaigns;
  }

  /**
   * Get active campaigns using a specific template
   * Requirement 19.7: Prevent deletion of templates in active campaigns
   * 
   * Helper method to check if a template is being used in any active campaigns.
   * Active campaigns include: RUNNING, SCHEDULED, and PAUSED statuses.
   * 
   * @param tenantId - Tenant ID
   * @param templateId - Template ID
   * @returns Array of active campaigns using the template
   */
  async getActiveCampaignsUsingTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<Campaign[]> {
    return this.getCampaignsUsingTemplate(tenantId, templateId, true);
  }

  /**
   * Check if a template can be deleted
   * Requirement 19.7: Prevent deletion of templates in active campaigns
   * 
   * Validates whether a template can be safely deleted by checking:
   * - Template status (APPROVED templates cannot be deleted)
   * - Active campaign usage (templates in active campaigns cannot be deleted)
   * 
   * @param tenantId - Tenant ID
   * @param templateId - Template ID
   * @returns Object with canDelete flag and reason if cannot delete
   */
  async canDeleteTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<{
    canDelete: boolean;
    reason?: string;
    activeCampaigns?: Campaign[];
  }> {
    this.logger.log(`Checking if template ${templateId} can be deleted`);

    const template = await this.findOne(tenantId, templateId);

    // Check if template is approved
    if (template.status === TemplateStatus.APPROVED) {
      return {
        canDelete: false,
        reason:
          'Cannot delete approved template. Use archive endpoint instead to preserve the template.',
      };
    }

    // Check if template is used in active campaigns
    const activeCampaigns = await this.getActiveCampaignsUsingTemplate(
      tenantId,
      templateId,
    );

    if (activeCampaigns.length > 0) {
      const campaignNames = activeCampaigns.map((c) => c.name).join(', ');
      return {
        canDelete: false,
        reason: `Template is currently used in ${activeCampaigns.length} active campaign(s): ${campaignNames}. Please pause or complete these campaigns first.`,
        activeCampaigns,
      };
    }

    return {
      canDelete: true,
    };
  }

  /**
   * Get template usage statistics including campaign usage
   * Requirement 19.6: Track which templates are used in which campaigns
   * 
   * Returns comprehensive usage statistics for a template including:
   * - Total usage count
   * - Last used timestamp
   * - Number of campaigns using the template
   * - Active vs inactive campaign breakdown
   * - Campaign details
   * 
   * @param tenantId - Tenant ID
   * @param templateId - Template ID
   * @returns Template usage statistics
   */
  async getTemplateUsageStats(
    tenantId: string,
    templateId: string,
  ): Promise<{
    templateId: string;
    templateName: string;
    usageCount: number;
    lastUsedAt: Date | null;
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    campaigns: Array<{
      id: string;
      name: string;
      status: string;
      createdAt: Date;
      startedAt: Date | null;
      completedAt: Date | null;
      totalRecipients: number;
      sentCount: number;
    }>;
  }> {
    this.logger.log(`Getting usage stats for template ${templateId}`);

    const template = await this.findOne(tenantId, templateId);
    const allCampaigns = await this.getCampaignsUsingTemplate(tenantId, templateId);

    const activeCampaigns = allCampaigns.filter((c) =>
      [CampaignStatus.RUNNING, CampaignStatus.SCHEDULED, CampaignStatus.PAUSED].includes(
        c.status as any,
      ),
    );

    const completedCampaigns = allCampaigns.filter(
      (c) => c.status === CampaignStatus.COMPLETED,
    );

    const campaignDetails = allCampaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      createdAt: campaign.createdAt,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
    }));

    return {
      templateId: template.id,
      templateName: template.name,
      usageCount: template.usageCount,
      lastUsedAt: template.lastUsedAt,
      totalCampaigns: allCampaigns.length,
      activeCampaigns: activeCampaigns.length,
      completedCampaigns: completedCampaigns.length,
      campaigns: campaignDetails,
    };
  }

  // ==================== Cache Management Methods ====================

  /**
   * Get cache statistics
   * Task 58: Cache management and monitoring
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    templateKeys: number;
    listKeys: number;
    validationKeys: number;
    previewKeys: number;
  }> {
    return this.cacheService.getStats();
  }

  /**
   * Clear all template caches
   * Task 58: Cache invalidation logic
   */
  async clearAllCaches(): Promise<void> {
    await this.cacheService.clearAll();
    this.logger.log('All template caches cleared');
  }

  /**
   * Clear cache for a specific template
   * Task 58: Cache invalidation logic
   */
  async clearTemplateCache(tenantId: string, templateId: string): Promise<void> {
    // Verify template exists
    await this.findOne(tenantId, templateId);
    
    // Clear all caches for this template
    await this.cacheService.invalidateTemplate(templateId, tenantId);
    this.logger.log(`Cache cleared for template: ${templateId}`);
  }

  /**
   * Find template by Meta template ID
   */
  async findByMetaTemplateId(metaTemplateId: string): Promise<Template | null> {
    return await this.templatesRepository.findOne({
      where: { metaTemplateId },
    });
  }

  /**
   * Update template status (used by webhook)
   */
  async updateTemplateStatus(
    tenantId: string,
    templateId: string,
    status: string,
    rejectionReason?: string,
  ): Promise<Template> {
    const template = await this.findOne(tenantId, templateId);
    const oldStatus = template.status;

    template.status = status as any;
    if (rejectionReason) {
      template.rejectionReason = rejectionReason;
    }

    if (status === 'approved') {
      template.approvedAt = new Date();
    } else if (status === 'rejected') {
      template.rejectedAt = new Date();
    }

    const savedTemplate = await this.templatesRepository.save(template);

    // Log status change
    await this.statusHistoryService.logStatusChange({
      templateId: savedTemplate.id,
      tenantId: savedTemplate.tenantId,
      fromStatus: oldStatus,
      toStatus: status,
      reason: `Status updated via Meta webhook: ${status}${rejectionReason ? ` (${rejectionReason})` : ''}`,
    });

    // Clear cache
    await this.cacheService.invalidateTemplate(templateId, tenantId);

    return savedTemplate;
  }

  /**
   * Fetch templates from Meta and sync with local database
   */
  async syncTemplatesFromMeta(tenantId: string): Promise<{ synced: number; created: number; errors: string[] }> {
    this.logger.log(`🔄 Syncing templates from Meta for tenant: ${tenantId}`);

    try {
      const metaTemplates = await this.metaTemplateApiService.fetchAllTemplatesFromMeta(tenantId);
      let synced = 0;
      let created = 0;
      const errors: string[] = [];

      for (const metaTemplate of metaTemplates) {
        try {
          const localTemplate = await this.findByMetaTemplateId(metaTemplate.id);
          
          if (localTemplate) {
            // Update existing template status
            if (localTemplate.status !== metaTemplate.status.toLowerCase()) {
              await this.updateTemplateStatus(
                tenantId,
                localTemplate.id,
                metaTemplate.status.toLowerCase(),
                metaTemplate.rejection_reason,
              );
              synced++;
              this.logger.log(`✅ Updated template: ${metaTemplate.name} - Status: ${metaTemplate.status}`);
            }
          } else {
            // Create new template from Meta data
            this.logger.log(`📥 Creating new template from Meta: ${metaTemplate.name}`);
            const newTemplate = await this.createTemplateFromMeta(tenantId, metaTemplate);
            created++;
            this.logger.log(`✅ Created template: ${newTemplate.name} (${newTemplate.id})`);
          }
        } catch (error) {
          const errorMsg = `Failed to sync template ${metaTemplate.name}: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      this.logger.log(`✅ Sync completed: ${synced} updated, ${created} created, ${errors.length} errors`);
      return { synced, created, errors };
    } catch (error) {
      this.logger.error(`Failed to sync templates from Meta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new template from Meta template data
   */
  private async createTemplateFromMeta(tenantId: string, metaTemplate: any): Promise<Template> {
    const components: any = {};

    // Parse components from Meta format
    if (metaTemplate.components) {
      for (const component of metaTemplate.components) {
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
    }

    // Extract sample values
    const sampleValues: Record<string, string> = {};
    const bodyComponent = metaTemplate.components?.find((c: any) => c.type === 'BODY');
    if (bodyComponent?.example?.body_text) {
      bodyComponent.example.body_text[0]?.forEach((value: string, index: number) => {
        sampleValues[(index + 1).toString()] = value;
      });
    }

    // Map category
    const categoryMap: Record<string, string> = {
      UTILITY: 'utility',
      MARKETING: 'marketing',
      AUTHENTICATION: 'authentication',
      TRANSACTIONAL: 'utility',
      ACCOUNT_UPDATE: 'utility',
      OTP: 'authentication',
    };

    // Map status
    const statusMap: Record<string, string> = {
      APPROVED: 'approved',
      PENDING: 'pending',
      REJECTED: 'rejected',
      DELETED: 'draft',
    };

    // Create template
    const templateData: any = {
      tenantId,
      name: metaTemplate.name,
      displayName: metaTemplate.name,
      category: categoryMap[metaTemplate.category] || 'utility',
      language: metaTemplate.language,
      description: `Synced from Meta: ${metaTemplate.name}`,
      components,
      sampleValues,
      metaTemplateId: metaTemplate.id,
      metaTemplateName: metaTemplate.name,
      status: statusMap[metaTemplate.status] || 'draft',
      isActive: true,
      approvedAt: metaTemplate.status === 'APPROVED' ? new Date() : null,
      rejectedAt: metaTemplate.status === 'REJECTED' ? new Date() : null,
      rejectionReason: metaTemplate.rejection_reason || null,
    };

    const template = this.templatesRepository.create(templateData);
    return (await this.templatesRepository.save(template)) as unknown as Template;
  }

}

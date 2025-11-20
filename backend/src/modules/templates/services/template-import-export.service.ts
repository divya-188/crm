import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../entities/template.entity';
import { TemplatesService } from '../templates.service';
import { TemplateValidationEngine } from './template-validation.engine';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { TemplateAnalyticsService } from './template-analytics.service';
import { TemplateStatusHistoryService } from './template-status-history.service';

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: Array<{
    templateName: string;
    error: string;
    details?: any;
  }>;
  templates: Template[];
}

export interface ExportResult {
  templates: any[];
  metadata: {
    exportedAt: string;
    totalTemplates: number;
    tenantId: string;
    includeAnalytics: boolean;
    includeHistory: boolean;
  };
}

export interface ImportPreview {
  totalTemplates: number;
  validTemplates: number;
  invalidTemplates: number;
  duplicates: number;
  templates: Array<{
    name: string;
    displayName?: string;
    category: string;
    language: string;
    status: 'valid' | 'invalid' | 'duplicate';
    errors?: string[];
    warnings?: string[];
  }>;
}

@Injectable()
export class TemplateImportExportService {
  private readonly logger = new Logger(TemplateImportExportService.name);

  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    private readonly templatesService: TemplatesService,
    private readonly validationEngine: TemplateValidationEngine,
    private readonly analyticsService: TemplateAnalyticsService,
    private readonly statusHistoryService: TemplateStatusHistoryService,
  ) {}

  /**
   * Generate import preview without actually importing
   */
  async generateImportPreview(
    tenantId: string,
    templates: CreateTemplateDto[],
    options: {
      skipDuplicates?: boolean;
      namePrefix?: string;
    } = {},
  ): Promise<ImportPreview> {
    this.logger.log(`Generating import preview for ${templates.length} templates`);

    const preview: ImportPreview = {
      totalTemplates: templates.length,
      validTemplates: 0,
      invalidTemplates: 0,
      duplicates: 0,
      templates: [],
    };

    // Get existing template names for duplicate detection
    const existingTemplates = await this.templateRepository.find({
      where: { tenantId, isActive: true },
      select: ['name', 'language'],
    });

    const existingNames = new Set(
      existingTemplates.map(t => `${t.name}_${t.language}`),
    );

    for (const templateDto of templates) {
      const templateName = options.namePrefix
        ? `${options.namePrefix}${templateDto.name}`
        : templateDto.name;

      const templateKey = `${templateName}_${templateDto.language}`;
      const isDuplicate = existingNames.has(templateKey);

      // Validate template
      const validationResult = await this.validationEngine.validate(templateDto);

      const templatePreview: any = {
        name: templateName,
        displayName: templateDto.displayName,
        category: templateDto.category,
        language: templateDto.language,
        status: 'valid',
        errors: [],
        warnings: [],
      };

      if (!validationResult.isValid) {
        templatePreview.status = 'invalid';
        templatePreview.errors = validationResult.errors.map(e => e.message);
        preview.invalidTemplates++;
      } else if (isDuplicate && !options.skipDuplicates) {
        templatePreview.status = 'duplicate';
        templatePreview.errors = ['Template with this name and language already exists'];
        preview.duplicates++;
      } else {
        preview.validTemplates++;
      }

      if (validationResult.warnings && validationResult.warnings.length > 0) {
        templatePreview.warnings = validationResult.warnings.map(w => w.message);
      }

      preview.templates.push(templatePreview);
    }

    return preview;
  }

  /**
   * Import templates from JSON data
   */
  async importTemplates(
    tenantId: string,
    userId: string,
    templates: CreateTemplateDto[],
    options: {
      skipDuplicates?: boolean;
      createVersions?: boolean;
      namePrefix?: string;
    } = {},
  ): Promise<ImportResult> {
    this.logger.log(`Starting import of ${templates.length} templates for tenant ${tenantId}`);

    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      templates: [],
    };

    // Get existing templates for duplicate detection
    const existingTemplates = await this.templateRepository.find({
      where: { tenantId, isActive: true },
      select: ['id', 'name', 'language', 'version'],
    });

    const existingTemplatesMap = new Map(
      existingTemplates.map(t => [`${t.name}_${t.language}`, t]),
    );

    for (const templateDto of templates) {
      try {
        // Apply name prefix if provided
        const templateName = options.namePrefix
          ? `${options.namePrefix}${templateDto.name}`
          : templateDto.name;

        const templateKey = `${templateName}_${templateDto.language}`;
        const existingTemplate = existingTemplatesMap.get(templateKey);

        // Handle duplicates
        if (existingTemplate) {
          if (options.createVersions) {
            // Create new version of existing template
            this.logger.log(`Creating new version for template: ${templateName}`);
            const newVersion = await this.templatesService.updateTemplate(
              tenantId,
              existingTemplate.id,
              { ...templateDto, name: templateName },
              userId,
              true, // createNewVersion
            );
            result.templates.push(newVersion);
            result.imported++;
          } else if (options.skipDuplicates) {
            // Skip duplicate
            this.logger.log(`Skipping duplicate template: ${templateName}`);
            result.skipped++;
          } else {
            // Throw error for duplicate
            throw new ConflictException(
              `Template with name '${templateName}' and language '${templateDto.language}' already exists`,
            );
          }
          continue;
        }

        // Validate template before import
        const validationResult = await this.validationEngine.validate(templateDto);
        if (!validationResult.isValid) {
          throw new BadRequestException({
            message: 'Template validation failed',
            errors: validationResult.errors,
          });
        }

        // Create new template
        const newTemplate = await this.templatesService.create(tenantId, {
          ...templateDto,
          name: templateName,
        });

        result.templates.push(newTemplate);
        result.imported++;

        this.logger.log(`Successfully imported template: ${templateName}`);
      } catch (error) {
        this.logger.error(`Failed to import template: ${templateDto.name}`, error.stack);
        result.failed++;
        result.errors.push({
          templateName: templateDto.name,
          error: error.message,
          details: error.response || error,
        });
      }
    }

    this.logger.log(
      `Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`,
    );

    return result;
  }

  /**
   * Export templates to JSON format
   */
  async exportTemplates(
    tenantId: string,
    options: {
      templateIds?: string[];
      includeArchived?: boolean;
      includeAnalytics?: boolean;
      includeHistory?: boolean;
    } = {},
  ): Promise<ExportResult> {
    this.logger.log(`Starting export for tenant ${tenantId}`);

    let templates: Template[];

    if (options.templateIds && options.templateIds.length > 0) {
      // Export specific templates
      templates = await this.templateRepository.find({
        where: {
          tenantId,
          id: options.templateIds as any, // TypeORM In operator
        },
      });

      if (templates.length !== options.templateIds.length) {
        const foundIds = templates.map(t => t.id);
        const missingIds = options.templateIds.filter(id => !foundIds.includes(id));
        this.logger.warn(`Some templates not found: ${missingIds.join(', ')}`);
      }
    } else {
      // Export all templates
      const queryBuilder = this.templateRepository
        .createQueryBuilder('template')
        .where('template.tenantId = :tenantId', { tenantId });

      if (!options.includeArchived) {
        queryBuilder.andWhere('template.isActive = :isActive', { isActive: true });
      }

      templates = await queryBuilder.getMany();
    }

    this.logger.log(`Exporting ${templates.length} templates`);

    // Prepare export data
    const exportData = await Promise.all(
      templates.map(async (template) => {
        const templateData: any = {
          // Core template data
          name: template.name,
          displayName: template.displayName,
          category: template.category,
          language: template.language,
          description: template.description,
          components: template.components,
          sampleValues: template.sampleValues,
          
          // Metadata (for reference, not imported)
          metadata: {
            originalId: template.id,
            status: template.status,
            version: template.version,
            qualityScore: template.qualityScore,
            usageCount: template.usageCount,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            submittedAt: template.submittedAt,
            approvedAt: template.approvedAt,
            rejectedAt: template.rejectedAt,
          },
        };

        // Include analytics if requested
        if (options.includeAnalytics) {
          try {
            const analytics = await this.analyticsService.getTemplateAnalytics(
              tenantId,
              template.id,
              {
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                endDate: new Date(),
              },
            );
            templateData.analytics = analytics;
          } catch (error) {
            this.logger.warn(`Failed to fetch analytics for template ${template.id}`, error.message);
          }
        }

        // Include status history if requested
        if (options.includeHistory) {
          try {
            const history = await this.statusHistoryService.getTemplateStatusHistory(
              template.id,
              tenantId,
            );
            templateData.statusHistory = history;
          } catch (error) {
            this.logger.warn(`Failed to fetch history for template ${template.id}`, error.message);
          }
        }

        return templateData;
      }),
    );

    const result: ExportResult = {
      templates: exportData,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalTemplates: templates.length,
        tenantId,
        includeAnalytics: options.includeAnalytics || false,
        includeHistory: options.includeHistory || false,
      },
    };

    this.logger.log(`Export completed: ${templates.length} templates exported`);

    return result;
  }

  /**
   * Validate import file structure
   */
  validateImportFile(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data) {
      errors.push('Import data is empty');
      return { valid: false, errors };
    }

    // Check if it's an array of templates or an export result object
    let templates: any[];
    if (Array.isArray(data)) {
      templates = data;
    } else if (data.templates && Array.isArray(data.templates)) {
      templates = data.templates;
    } else {
      errors.push('Invalid import file structure. Expected array of templates or export result object.');
      return { valid: false, errors };
    }

    if (templates.length === 0) {
      errors.push('No templates found in import file');
      return { valid: false, errors };
    }

    // Validate each template has required fields
    templates.forEach((template, index) => {
      if (!template.name) {
        errors.push(`Template at index ${index} is missing 'name' field`);
      }
      if (!template.category) {
        errors.push(`Template at index ${index} is missing 'category' field`);
      }
      if (!template.language) {
        errors.push(`Template at index ${index} is missing 'language' field`);
      }
      if (!template.components || !template.components.body) {
        errors.push(`Template at index ${index} is missing 'components.body' field`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract templates from import data (handles both array and export result format)
   */
  extractTemplatesFromImportData(data: any): CreateTemplateDto[] {
    if (Array.isArray(data)) {
      return data;
    } else if (data.templates && Array.isArray(data.templates)) {
      // Extract only the template data, not metadata
      return data.templates.map(t => ({
        name: t.name,
        displayName: t.displayName,
        category: t.category,
        language: t.language,
        description: t.description,
        components: t.components,
        sampleValues: t.sampleValues,
      }));
    }
    return [];
  }
}

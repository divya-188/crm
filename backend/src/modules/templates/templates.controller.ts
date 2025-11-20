import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MetaTemplateApiService } from './services/meta-template-api.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { TemplateMediaService } from './services/template-media.service';
import { TemplateStatusHistoryService } from './services/template-status-history.service';
import { TemplatePreviewService } from './services/template-preview.service';
import { TemplateTestingService } from './services/template-testing.service';
import { TemplateAnalyticsService } from './services/template-analytics.service';
import { TemplateAuditService } from './services/template-audit.service';
import { SendTestTemplateDto, AddTestPhoneNumberDto, UpdateTestPhoneNumberDto } from './dto/send-test-template.dto';
import { ArchiveTemplateDto, BulkArchiveTemplatesDto, BulkRestoreTemplatesDto } from './dto/archive-template.dto';
import { ValidateTemplateDto } from './dto/validate-template.dto';
import { TemplateValidationEngine } from './services/template-validation.engine';
import { RedisService } from '../../common/services/redis.service';
import { TemplateImportExportService } from './services/template-import-export.service';
import { ImportTemplateDto, ExportTemplatesDto } from './dto/import-template.dto';
import { TemplatePermissionsGuard, TemplatePermission } from './guards/template-permissions.guard';
import { TemplateVisibilityGuard } from './guards/template-visibility.guard';
import { TemplatePermissions } from './decorators/template-permissions.decorator';

@ApiTags('Templates')
@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard, TemplatePermissionsGuard, TemplateVisibilityGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly templateMediaService: TemplateMediaService,
    private readonly statusHistoryService: TemplateStatusHistoryService,
    private readonly templatePreviewService: TemplatePreviewService,
    private readonly templateTestingService: TemplateTestingService,
    private readonly templateAnalyticsService: TemplateAnalyticsService,
    private readonly templateAuditService: TemplateAuditService,
    private readonly validationEngine: TemplateValidationEngine,
    private readonly redisService: RedisService,
    private readonly importExportService: TemplateImportExportService,
    private readonly metaTemplateApiService: MetaTemplateApiService,
  ) {}

  // Note: Cache service is accessed through templatesService

  @Post()
  @TemplatePermissions(TemplatePermission.CREATE)
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    const template = await this.templatesService.create(tenantId, createTemplateDto, userId);
    
    // Log the creation action
    await this.templateAuditService.logAction({
      templateId: template.id,
      tenantId,
      action: 'create' as any,
      userId,
      metadata: {
        templateName: template.name,
        category: template.category,
        language: template.language,
      },
    });
    
    return template;
  }

  @Post('validate')
  @ApiOperation({ 
    summary: 'Validate template without saving',
    description: 'Validates template structure, placeholders, buttons, and checks for policy violations. Returns validation errors, warnings, and quality score. Results are cached for 5 minutes.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template validation completed',
    schema: {
      type: 'object',
      properties: {
        isValid: { 
          type: 'boolean',
          description: 'Whether the template passes all validation checks',
        },
        errors: {
          type: 'array',
          description: 'List of validation errors that must be fixed',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', description: 'Field that has the error' },
              message: { type: 'string', description: 'Error message' },
              code: { type: 'string', description: 'Error code for programmatic handling' },
            },
          },
        },
        warnings: {
          type: 'array',
          description: 'List of validation warnings (best practices)',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', description: 'Field that has the warning' },
              message: { type: 'string', description: 'Warning message' },
              code: { type: 'string', description: 'Warning code' },
            },
          },
        },
        qualityScore: {
          type: 'object',
          description: 'Quality score breakdown (0-100)',
          properties: {
            score: { 
              type: 'number',
              description: 'Overall quality score (0-100)',
              example: 85,
            },
            rating: { 
              type: 'string',
              description: 'Quality rating',
              enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'],
              example: 'Good',
            },
            breakdown: {
              type: 'array',
              description: 'Detailed scoring by category',
              items: {
                type: 'object',
                properties: {
                  category: { 
                    type: 'string',
                    description: 'Scoring category',
                    example: 'Body Length',
                  },
                  points: { 
                    type: 'number',
                    description: 'Points added or deducted',
                    example: 5,
                  },
                  message: { 
                    type: 'string',
                    description: 'Description of the scoring',
                    example: 'Body text length is optimal',
                  },
                  suggestion: { 
                    type: 'string',
                    description: 'Suggestion for improvement (empty if no improvement needed)',
                    example: '',
                  },
                },
              },
            },
          },
        },
        cached: {
          type: 'boolean',
          description: 'Whether this result was served from cache',
        },
        cacheExpiresIn: {
          type: 'number',
          description: 'Seconds until cache expires (if cached)',
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async validateTemplate(
    @Body() validateDto: ValidateTemplateDto,
  ) {
    // Generate cache key based on template data
    const cacheKey = this.generateValidationCacheKey(validateDto);
    
    // Check cache first
    const cachedResult = await this.redisService.get<any>(cacheKey);
    if (cachedResult) {
      const ttl = await this.redisService.ttl(cacheKey);
      return {
        ...cachedResult,
        cached: true,
        cacheExpiresIn: ttl > 0 ? ttl : null,
      };
    }

    // Perform validation
    const validationResult = await this.validationEngine.validate(validateDto);
    
    // Calculate quality score
    const qualityScore = this.validationEngine.calculateQualityScore(validateDto);

    // Prepare response
    const response = {
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      qualityScore,
      cached: false,
      cacheExpiresIn: null,
    };

    // Cache the result for 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, response, 300);

    return response;
  }

  /**
   * Generate cache key for validation results
   * Uses a hash of the template data to ensure uniqueness
   */
  private generateValidationCacheKey(template: ValidateTemplateDto): string {
    // Create a deterministic string representation of the template
    const templateString = JSON.stringify({
      name: template.name,
      category: template.category,
      language: template.language,
      description: template.description || '',
      components: template.components,
      sampleValues: template.sampleValues || {},
    });

    // Create a simple hash (for production, consider using crypto.createHash)
    let hash = 0;
    for (let i = 0; i < templateString.length; i++) {
      const char = templateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `template:validation:${Math.abs(hash)}`;
  }

  // Template Metadata Endpoints (must come before :id route)
  
  @Get('categories')
  @ApiOperation({ 
    summary: 'Get all available template categories with descriptions',
    description: 'Returns a list of Meta-defined template categories with detailed descriptions to help users select the correct category. Results are cached for 24 hours.',
  })
  async getCategories() {
    const cacheKey = 'templates:metadata:categories';
    
    // Check cache first
    const cachedResult = await this.redisService.get<any>(cacheKey);
    if (cachedResult) {
      const ttl = await this.redisService.ttl(cacheKey);
      return {
        ...cachedResult,
        cached: true,
        cacheExpiresIn: ttl > 0 ? ttl : null,
      };
    }

    // Define categories with descriptions
    const categories = [
      {
        code: 'TRANSACTIONAL',
        name: 'Transactional',
        description: 'For order confirmations, shipping updates, payment receipts, and other transaction-related messages. These templates confirm a transaction or provide updates about an ongoing transaction.',
        examples: [
          'Order confirmation',
          'Shipping notification',
          'Payment receipt',
          'Delivery confirmation',
          'Booking confirmation',
          'Appointment confirmation',
        ],
        approvalDifficulty: 'easy',
        restrictions: [
          'Must be related to a completed or ongoing transaction',
          'Cannot be used for promotional content',
          'Should be sent only after user action',
        ],
      },
      {
        code: 'UTILITY',
        name: 'Utility',
        description: 'For account updates, alerts, and other non-promotional messages that provide value to the user. These templates help users manage their account or provide important notifications.',
        examples: [
          'Password reset',
          'Account verification',
          'Security alerts',
          'Service updates',
          'Subscription renewal reminders',
          'Account statement',
        ],
        approvalDifficulty: 'easy',
        restrictions: [
          'Must provide utility or value to the user',
          'Cannot contain promotional content',
          'Should be actionable or informational',
        ],
      },
      {
        code: 'MARKETING',
        name: 'Marketing',
        description: 'For promotional messages, offers, and marketing campaigns. These templates are used to promote products, services, or events. Note: Marketing templates have stricter approval requirements and users must opt-in.',
        examples: [
          'Product promotions',
          'Special offers',
          'Event invitations',
          'New product announcements',
          'Seasonal sales',
          'Newsletter updates',
        ],
        approvalDifficulty: 'strict',
        restrictions: [
          'Users must explicitly opt-in to receive marketing messages',
          'Must comply with local marketing regulations',
          'Cannot be sent more than once per 24 hours to the same user',
          'Must include clear opt-out mechanism',
          'Subject to higher quality standards',
        ],
      },
      {
        code: 'ACCOUNT_UPDATE',
        name: 'Account Update',
        description: 'For important account-related notifications such as password changes, security alerts, or profile updates. These templates inform users about changes to their account.',
        examples: [
          'Password changed notification',
          'Email address updated',
          'Phone number verified',
          'Profile information changed',
          'Login from new device',
          'Account settings modified',
        ],
        approvalDifficulty: 'easy',
        restrictions: [
          'Must be related to account changes or security',
          'Should be sent immediately after the account change',
          'Cannot be used for promotional content',
        ],
      },
      {
        code: 'OTP',
        name: 'One-Time Password',
        description: 'For sending one-time passwords, verification codes, and authentication messages. These templates are used for secure authentication and verification purposes.',
        examples: [
          'Login verification code',
          'Two-factor authentication',
          'Phone number verification',
          'Email verification code',
          'Transaction authorization code',
          'Password reset code',
        ],
        approvalDifficulty: 'easy',
        restrictions: [
          'Must contain a time-sensitive code or OTP',
          'Should expire within a reasonable timeframe',
          'Cannot be used for non-authentication purposes',
          'Must be sent only when user requests verification',
        ],
      },
    ];

    const response = {
      categories,
      cached: false,
      cacheExpiresIn: null,
    };

    // Cache for 24 hours (86400 seconds)
    await this.redisService.set(cacheKey, response, 86400);

    return response;
  }

  @Get('languages')
  @ApiOperation({ 
    summary: 'Get all supported template languages with name mappings',
    description: 'Returns a list of supported languages with ISO codes and human-readable names. Results are cached for 24 hours.',
  })
  async getLanguages() {
    const cacheKey = 'templates:metadata:languages';
    
    // Check cache first
    const cachedResult = await this.redisService.get<any>(cacheKey);
    if (cachedResult) {
      const ttl = await this.redisService.ttl(cacheKey);
      return {
        ...cachedResult,
        cached: true,
        cacheExpiresIn: ttl > 0 ? ttl : null,
      };
    }

    // Define supported languages with mappings
    const languages = [
      // Popular languages (marked for UI prominence)
      { code: 'en_US', name: 'English (US)', nativeName: 'English', direction: 'ltr', popular: true },
      { code: 'en_GB', name: 'English (UK)', nativeName: 'English', direction: 'ltr', popular: true },
      { code: 'es_ES', name: 'Spanish (Spain)', nativeName: 'Español', direction: 'ltr', popular: true },
      { code: 'es_MX', name: 'Spanish (Mexico)', nativeName: 'Español', direction: 'ltr', popular: true },
      { code: 'pt_BR', name: 'Portuguese (Brazil)', nativeName: 'Português', direction: 'ltr', popular: true },
      { code: 'pt_PT', name: 'Portuguese (Portugal)', nativeName: 'Português', direction: 'ltr', popular: true },
      { code: 'hi_IN', name: 'Hindi (India)', nativeName: 'हिन्दी', direction: 'ltr', popular: true },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', popular: true },
      { code: 'fr_FR', name: 'French (France)', nativeName: 'Français', direction: 'ltr', popular: true },
      { code: 'de_DE', name: 'German (Germany)', nativeName: 'Deutsch', direction: 'ltr', popular: true },
      { code: 'it_IT', name: 'Italian (Italy)', nativeName: 'Italiano', direction: 'ltr', popular: true },
      { code: 'zh_CN', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr', popular: true },
      { code: 'zh_TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', direction: 'ltr', popular: true },
      { code: 'ja_JP', name: 'Japanese', nativeName: '日本語', direction: 'ltr', popular: true },
      { code: 'ko_KR', name: 'Korean', nativeName: '한국어', direction: 'ltr', popular: true },
      { code: 'ru_RU', name: 'Russian', nativeName: 'Русский', direction: 'ltr', popular: true },
      { code: 'id_ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr', popular: true },
      
      // Additional languages
      { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', direction: 'ltr', popular: false },
      { code: 'sq', name: 'Albanian', nativeName: 'Shqip', direction: 'ltr', popular: false },
      { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', direction: 'ltr', popular: false },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr', popular: false },
      { code: 'bg', name: 'Bulgarian', nativeName: 'Български', direction: 'ltr', popular: false },
      { code: 'ca', name: 'Catalan', nativeName: 'Català', direction: 'ltr', popular: false },
      { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', direction: 'ltr', popular: false },
      { code: 'cs', name: 'Czech', nativeName: 'Čeština', direction: 'ltr', popular: false },
      { code: 'da', name: 'Danish', nativeName: 'Dansk', direction: 'ltr', popular: false },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr', popular: false },
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', popular: false },
      { code: 'et', name: 'Estonian', nativeName: 'Eesti', direction: 'ltr', popular: false },
      { code: 'fil', name: 'Filipino', nativeName: 'Filipino', direction: 'ltr', popular: false },
      { code: 'fi', name: 'Finnish', nativeName: 'Suomi', direction: 'ltr', popular: false },
      { code: 'ka', name: 'Georgian', nativeName: 'ქართული', direction: 'ltr', popular: false },
      { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', direction: 'ltr', popular: false },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr', popular: false },
      { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl', popular: false },
      { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', direction: 'ltr', popular: false },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr', popular: false },
      { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ', direction: 'ltr', popular: false },
      { code: 'lo', name: 'Lao', nativeName: 'ລາວ', direction: 'ltr', popular: false },
      { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', direction: 'ltr', popular: false },
      { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', direction: 'ltr', popular: false },
      { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', direction: 'ltr', popular: false },
      { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', direction: 'ltr', popular: false },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr', popular: false },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr', popular: false },
      { code: 'nb', name: 'Norwegian', nativeName: 'Norsk', direction: 'ltr', popular: false },
      { code: 'fa', name: 'Persian', nativeName: 'فارسی', direction: 'rtl', popular: false },
      { code: 'pl', name: 'Polish', nativeName: 'Polski', direction: 'ltr', popular: false },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr', popular: false },
      { code: 'ro', name: 'Romanian', nativeName: 'Română', direction: 'ltr', popular: false },
      { code: 'sr', name: 'Serbian', nativeName: 'Српски', direction: 'ltr', popular: false },
      { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', direction: 'ltr', popular: false },
      { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', direction: 'ltr', popular: false },
      { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', direction: 'ltr', popular: false },
      { code: 'sv', name: 'Swedish', nativeName: 'Svenska', direction: 'ltr', popular: false },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr', popular: false },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr', popular: false },
      { code: 'th', name: 'Thai', nativeName: 'ไทย', direction: 'ltr', popular: false },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr', popular: false },
      { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', direction: 'ltr', popular: false },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', popular: false },
      { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek', direction: 'ltr', popular: false },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr', popular: false },
    ];

    const response = {
      languages,
      cached: false,
      cacheExpiresIn: null,
    };

    // Cache for 24 hours (86400 seconds)
    await this.redisService.set(cacheKey, response, 86400);

    return response;
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates with advanced filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of templates retrieved' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'createdAt', 'usageCount', 'approvedAt', 'qualityScore'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('language') language?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('sortBy') sortBy?: 'name' | 'createdAt' | 'usageCount' | 'approvedAt' | 'qualityScore',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.templatesService.findTemplates(tenantId, {
      page,
      limit,
      status,
      category,
      language,
      search,
      isActive,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.templatesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update template with optional versioning' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiQuery({ name: 'createNewVersion', required: false, type: Boolean })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateData: Partial<CreateTemplateDto>,
    @Query('createNewVersion') createNewVersion?: boolean,
  ) {
    return this.templatesService.updateTemplate(tenantId, id, updateData, undefined, createNewVersion);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing template' })
  @ApiResponse({ status: 201, description: 'Template duplicated' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  duplicate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('newName') newName?: string,
  ) {
    return this.templatesService.duplicateTemplate(tenantId, id, undefined, newName);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a template (soft delete) with optional reason' })
  @ApiResponse({ 
    status: 200, 
    description: 'Template archived successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string' },
        isActive: { type: 'boolean' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  archive(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @UserId() userId: string,
    @Body() dto: ArchiveTemplateDto,
  ) {
    return this.templatesService.archiveTemplate(tenantId, id, userId, dto.reason);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a template from archive' })
  @ApiResponse({ 
    status: 200, 
    description: 'Template restored successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string' },
        isActive: { type: 'boolean' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Template is not archived' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  restore(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @UserId() userId: string,
  ) {
    return this.templatesService.restoreTemplate(tenantId, id, userId);
  }

  @Get('archived')
  @ApiOperation({ summary: 'Get all archived templates with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of archived templates retrieved',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        hasMore: { type: 'boolean' },
      },
    },
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'createdAt', 'usageCount', 'approvedAt', 'qualityScore'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  findArchived(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('language') language?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'name' | 'createdAt' | 'usageCount' | 'approvedAt' | 'qualityScore',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.templatesService.findArchivedTemplates(tenantId, {
      page,
      limit,
      status,
      category,
      language,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Post('bulk-archive')
  @ApiOperation({ summary: 'Archive multiple templates at once' })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk archive completed',
    schema: {
      type: 'object',
      properties: {
        archived: { type: 'number', description: 'Number of templates archived' },
        failed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  bulkArchive(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() dto: BulkArchiveTemplatesDto,
  ) {
    return this.templatesService.bulkArchiveTemplates(tenantId, dto.templateIds, userId, dto.reason);
  }

  @Post('bulk-restore')
  @ApiOperation({ summary: 'Restore multiple templates from archive at once' })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk restore completed',
    schema: {
      type: 'object',
      properties: {
        restored: { type: 'number', description: 'Number of templates restored' },
        failed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  bulkRestore(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() dto: BulkRestoreTemplatesDto,
  ) {
    return this.templatesService.bulkRestoreTemplates(tenantId, dto.templateIds, userId);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete template (hard delete - only for non-approved templates)',
    description: 'Permanently deletes a template. APPROVED templates cannot be deleted and must be archived instead.',
  })
  @ApiResponse({ status: 200, description: 'Template deleted permanently' })
  @ApiResponse({ status: 400, description: 'Cannot delete approved template' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @UserId() userId: string,
  ) {
    await this.templatesService.remove(tenantId, id, userId);
    return { success: true, message: 'Template deleted permanently' };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit template for approval' })
  @ApiResponse({ status: 200, description: 'Template submitted' })
  submit(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.templatesService.submit(tenantId, id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve template' })
  @ApiResponse({ status: 200, description: 'Template approved' })
  approve(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('externalId') externalId?: string,
  ) {
    return this.templatesService.approve(tenantId, id, externalId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject template' })
  @ApiResponse({ status: 200, description: 'Template rejected' })
  reject(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.templatesService.reject(tenantId, id, reason);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a template' })
  @ApiResponse({ 
    status: 200, 
    description: 'Template versions retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          displayName: { type: 'string', nullable: true },
          version: { type: 'number' },
          status: { type: 'string' },
          qualityScore: { type: 'number', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          submittedAt: { type: 'string', format: 'date-time', nullable: true },
          approvedAt: { type: 'string', format: 'date-time', nullable: true },
          rejectedAt: { type: 'string', format: 'date-time', nullable: true },
          parentTemplateId: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getVersions(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.templatesService.getTemplateVersions(tenantId, id);
  }

  @Post(':id/refresh-status')
  @ApiOperation({ 
    summary: 'Manually refresh template approval status from Meta API',
    description: 'Fetches the latest approval status from Meta API for a pending template. Useful when you want to check status immediately instead of waiting for the automatic 5-minute polling.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template status refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string' },
        approvalStatus: { type: 'string', nullable: true },
        rejectionReason: { type: 'string', nullable: true },
        metaTemplateId: { type: 'string', nullable: true },
        submittedAt: { type: 'string', format: 'date-time', nullable: true },
        approvedAt: { type: 'string', format: 'date-time', nullable: true },
        rejectedAt: { type: 'string', format: 'date-time', nullable: true },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Template is not in pending status or does not have Meta template ID' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        accessToken: { 
          type: 'string', 
          description: 'Optional Meta API access token. If not provided, uses default from configuration.',
          nullable: true,
        },
      },
    },
  })
  async refreshStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('accessToken') accessToken?: string,
  ) {
    return this.templatesService.refreshTemplateStatus(tenantId, id, accessToken);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Generate WhatsApp-style preview of template' })
  @ApiResponse({ 
    status: 200, 
    description: 'Template preview generated',
    schema: {
      type: 'object',
      properties: {
        header: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            content: { type: 'string' },
            mediaUrl: { type: 'string', nullable: true },
          },
          nullable: true,
        },
        body: { type: 'string' },
        footer: { type: 'string', nullable: true },
        buttons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              text: { type: 'string' },
              url: { type: 'string', nullable: true },
              phoneNumber: { type: 'string', nullable: true },
            },
          },
          nullable: true,
        },
        metadata: {
          type: 'object',
          properties: {
            templateName: { type: 'string' },
            category: { type: 'string' },
            language: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiQuery({ name: 'sampleValues', required: false, description: 'JSON string of sample values to override template defaults' })
  async getPreview(
    @Param('id') id: string,
    @Query('sampleValues') sampleValuesJson?: string,
  ) {
    const sampleValues = sampleValuesJson ? JSON.parse(sampleValuesJson) : undefined;
    return this.templatePreviewService.generatePreview(id, sampleValues);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Generate preview with custom sample values (POST)' })
  @ApiResponse({ status: 200, description: 'Template preview generated' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async postPreview(
    @Param('id') id: string,
    @Body('sampleValues') sampleValues?: Record<string, string>,
  ) {
    return this.templatePreviewService.generatePreview(id, sampleValues);
  }

  @Get(':id/preview/whatsapp-bubble')
  @ApiOperation({ summary: 'Generate WhatsApp message bubble preview (HTML + plain text)' })
  @ApiResponse({ 
    status: 200, 
    description: 'WhatsApp bubble preview generated',
    schema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML representation of WhatsApp message bubble' },
        plainText: { type: 'string', description: 'Plain text representation' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiQuery({ name: 'sampleValues', required: false, description: 'JSON string of sample values' })
  async getWhatsAppBubblePreview(
    @Param('id') id: string,
    @Query('sampleValues') sampleValuesJson?: string,
  ) {
    const sampleValues = sampleValuesJson ? JSON.parse(sampleValuesJson) : undefined;
    return this.templatePreviewService.generateWhatsAppBubblePreview(id, sampleValues);
  }

  @Post('preview/from-data')
  @ApiOperation({ summary: 'Generate preview from template data without saving' })
  @ApiResponse({ status: 200, description: 'Preview generated from data' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        templateData: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            displayName: { type: 'string', nullable: true },
            category: { type: 'string' },
            language: { type: 'string' },
            components: { type: 'object' },
            sampleValues: { type: 'object', nullable: true },
          },
        },
        sampleValues: { type: 'object', nullable: true },
      },
    },
  })
  async previewFromData(
    @Body('templateData') templateData: any,
    @Body('sampleValues') sampleValues?: Record<string, string>,
  ) {
    return this.templatePreviewService.generatePreviewFromData(templateData, sampleValues);
  }

  @Delete(':id/preview/cache')
  @ApiOperation({ summary: 'Invalidate preview cache for a template' })
  @ApiResponse({ status: 200, description: 'Cache invalidated' })
  invalidatePreviewCache(@Param('id') id: string) {
    this.templatePreviewService.invalidateCache(id);
    return { success: true, message: 'Preview cache invalidated' };
  }

  @Get('preview/cache/stats')
  @ApiOperation({ summary: 'Get preview cache statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache statistics retrieved',
    schema: {
      type: 'object',
      properties: {
        size: { type: 'number' },
        maxSize: { type: 'number' },
        ttl: { type: 'number' },
      },
    },
  })
  getPreviewCacheStats() {
    return this.templatePreviewService.getCacheStats();
  }

  @Post('media/upload')
  @ApiOperation({ summary: 'Upload media for template header' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: ['image', 'video', 'document'],
        },
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Media uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        mediaHandle: { type: 'string' },
        mediaUrl: { type: 'string' },
        type: { type: 'string' },
        size: { type: 'number' },
        mimetype: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or file type' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @TenantId() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: 'image' | 'video' | 'document',
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!type) {
      throw new BadRequestException('Media type is required (image, video, or document)');
    }

    return this.templateMediaService.uploadMedia(tenantId, file, type);
  }

  @Get('media/:mediaHandle/preview')
  @ApiOperation({ summary: 'Get media preview URL' })
  @ApiResponse({ 
    status: 200, 
    description: 'Media preview URL retrieved',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        type: { type: 'string' },
        expiresAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async getMediaPreview(
    @TenantId() tenantId: string,
    @Param('mediaHandle') mediaHandle: string,
  ) {
    return this.templateMediaService.getMediaPreview(tenantId, mediaHandle);
  }

  // Status History Endpoints

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Get status history for a template' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status history retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fromStatus: { type: 'string', nullable: true },
          toStatus: { type: 'string' },
          reason: { type: 'string', nullable: true },
          metaResponse: { type: 'object', nullable: true },
          changedByUserId: { type: 'string', nullable: true },
          changedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getStatusHistory(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.statusHistoryService.getTemplateStatusHistory(id, tenantId);
  }

  @Get(':id/status-timeline')
  @ApiOperation({ summary: 'Get status timeline for a template' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status timeline retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fromStatus: { type: 'string', nullable: true },
          toStatus: { type: 'string' },
          reason: { type: 'string', nullable: true },
          metaResponse: { type: 'object', nullable: true },
          changedByUserId: { type: 'string', nullable: true },
          changedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getStatusTimeline(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.statusHistoryService.generateStatusTimeline(id, tenantId);
  }

  @Get('status-history/recent')
  @ApiOperation({ summary: 'Get recent status changes across all templates' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recent status changes retrieved',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of recent changes to retrieve (default: 20)' })
  async getRecentStatusChanges(
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.statusHistoryService.getRecentStatusChanges(tenantId, limit);
  }

  @Get('status-history/rejections')
  @ApiOperation({ summary: 'Get rejection history for all templates' })
  @ApiResponse({ 
    status: 200, 
    description: 'Rejection history retrieved',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of rejections to retrieve (default: 50)' })
  async getRejectionHistory(
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.statusHistoryService.getRejectionHistory(tenantId, limit);
  }

  @Get('status-history/approvals')
  @ApiOperation({ summary: 'Get approval history for all templates' })
  @ApiResponse({ 
    status: 200, 
    description: 'Approval history retrieved',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of approvals to retrieve (default: 50)' })
  async getApprovalHistory(
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.statusHistoryService.getApprovalHistory(tenantId, limit);
  }

  @Get('status-history/stats')
  @ApiOperation({ summary: 'Get status change statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status change statistics retrieved',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'number',
      },
    },
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for statistics (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for statistics (ISO format)' })
  async getStatusChangeStats(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.statusHistoryService.getStatusChangeStats(tenantId, start, end);
  }

  // Template Testing Endpoints

  @Post(':id/test')
  @ApiOperation({ summary: 'Send test template to a phone number' })
  @ApiResponse({ 
    status: 201, 
    description: 'Test template sent successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        templateId: { type: 'string' },
        testPhoneNumber: { type: 'string' },
        placeholderValues: { type: 'object' },
        status: { type: 'string' },
        metaMessageId: { type: 'string', nullable: true },
        errorMessage: { type: 'string', nullable: true },
        sentAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request or template cannot be tested' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async sendTestTemplate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: SendTestTemplateDto,
    @UserId() userId?: string,
  ) {
    return this.templateTestingService.sendTestTemplate(tenantId, id, dto, userId);
  }

  @Get(':id/test-history')
  @ApiOperation({ summary: 'Get test send history for a template' })
  @ApiResponse({ 
    status: 200, 
    description: 'Test send history retrieved',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              templateId: { type: 'string' },
              testPhoneNumber: { type: 'string' },
              placeholderValues: { type: 'object' },
              status: { type: 'string' },
              metaMessageId: { type: 'string', nullable: true },
              errorMessage: { type: 'string', nullable: true },
              sentAt: { type: 'string', format: 'date-time' },
              deliveredAt: { type: 'string', format: 'date-time', nullable: true },
              readAt: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['sent', 'delivered', 'read', 'failed'] })
  async getTestSendHistory(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: 'sent' | 'delivered' | 'read' | 'failed',
  ) {
    return this.templateTestingService.getTestSendHistory(tenantId, id, {
      page,
      limit,
      status,
    });
  }

  @Get('test-sends/:testSendId')
  @ApiOperation({ summary: 'Get a specific test send by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Test send retrieved',
  })
  @ApiResponse({ status: 404, description: 'Test send not found' })
  async getTestSend(
    @TenantId() tenantId: string,
    @Param('testSendId') testSendId: string,
  ) {
    return this.templateTestingService.getTestSend(tenantId, testSendId);
  }

  // Test Phone Number Management Endpoints

  @Post('test-phone-numbers')
  @ApiOperation({ summary: 'Add a test phone number (max 5 per WABA)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Test phone number added successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        wabaId: { type: 'string' },
        phoneNumber: { type: 'string' },
        label: { type: 'string', nullable: true },
        isActive: { type: 'boolean' },
        usageCount: { type: 'number' },
        lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid phone number or max limit reached' })
  async addTestPhoneNumber(
    @TenantId() tenantId: string,
    @Body() dto: AddTestPhoneNumberDto,
    @UserId() userId?: string,
  ) {
    return this.templateTestingService.addTestPhoneNumber(tenantId, dto, userId);
  }

  @Get('test-phone-numbers')
  @ApiOperation({ summary: 'Get all test phone numbers for a tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Test phone numbers retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          wabaId: { type: 'string' },
          phoneNumber: { type: 'string' },
          label: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          usageCount: { type: 'number' },
          lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiQuery({ name: 'wabaId', required: false, type: String, description: 'Filter by WABA ID' })
  async getTestPhoneNumbers(
    @TenantId() tenantId: string,
    @Query('wabaId') wabaId?: string,
  ) {
    return this.templateTestingService.getTestPhoneNumbers(tenantId, wabaId);
  }

  @Patch('test-phone-numbers/:testNumberId')
  @ApiOperation({ summary: 'Update a test phone number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Test phone number updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Test phone number not found' })
  async updateTestPhoneNumber(
    @TenantId() tenantId: string,
    @Param('testNumberId') testNumberId: string,
    @Body() dto: UpdateTestPhoneNumberDto,
  ) {
    return this.templateTestingService.updateTestPhoneNumber(tenantId, testNumberId, dto);
  }

  @Delete('test-phone-numbers/:testNumberId')
  @ApiOperation({ summary: 'Remove a test phone number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Test phone number removed successfully',
  })
  @ApiResponse({ status: 404, description: 'Test phone number not found' })
  async removeTestPhoneNumber(
    @TenantId() tenantId: string,
    @Param('testNumberId') testNumberId: string,
  ) {
    await this.templateTestingService.removeTestPhoneNumber(tenantId, testNumberId);
    return { success: true, message: 'Test phone number removed successfully' };
  }

  // Template Analytics Endpoints

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get analytics for a specific template' })
  @ApiResponse({ 
    status: 200, 
    description: 'Template analytics retrieved',
    schema: {
      type: 'object',
      properties: {
        templateId: { type: 'string' },
        templateName: { type: 'string' },
        category: { type: 'string' },
        language: { type: 'string' },
        status: { type: 'string' },
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
          },
        },
        metrics: {
          type: 'object',
          properties: {
            totalSent: { type: 'number' },
            totalDelivered: { type: 'number' },
            totalRead: { type: 'number' },
            totalReplied: { type: 'number' },
            totalFailed: { type: 'number' },
            avgDeliveryRate: { type: 'number' },
            avgReadRate: { type: 'number' },
            avgResponseRate: { type: 'number' },
          },
        },
        dailyMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date' },
              sendCount: { type: 'number' },
              deliveredCount: { type: 'number' },
              readCount: { type: 'number' },
              repliedCount: { type: 'number' },
              failedCount: { type: 'number' },
              deliveryRate: { type: 'number' },
              readRate: { type: 'number' },
              responseRate: { type: 'number' },
            },
          },
        },
        trends: {
          type: 'object',
          properties: {
            deliveryRateTrend: { type: 'string', enum: ['up', 'down', 'stable'] },
            readRateTrend: { type: 'string', enum: ['up', 'down', 'stable'] },
            responseRateTrend: { type: 'string', enum: ['up', 'down', 'stable'] },
            usageTrend: { type: 'string', enum: ['up', 'down', 'stable'] },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for analytics (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for analytics (ISO format)' })
  async getTemplateAnalytics(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const options: any = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    return this.templateAnalyticsService.getTemplateAnalytics(tenantId, id, options);
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get analytics summary across all templates' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics summary retrieved',
    schema: {
      type: 'object',
      properties: {
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
          },
        },
        overallMetrics: {
          type: 'object',
          properties: {
            totalTemplates: { type: 'number' },
            activeTemplates: { type: 'number' },
            totalSent: { type: 'number' },
            avgDeliveryRate: { type: 'number' },
            avgReadRate: { type: 'number' },
            avgResponseRate: { type: 'number' },
          },
        },
        topTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              templateId: { type: 'string' },
              templateName: { type: 'string' },
              category: { type: 'string' },
              totalSent: { type: 'number' },
              deliveryRate: { type: 'number' },
              readRate: { type: 'number' },
              responseRate: { type: 'number' },
            },
          },
        },
        lowPerformingTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              templateId: { type: 'string' },
              templateName: { type: 'string' },
              category: { type: 'string' },
              totalSent: { type: 'number' },
              deliveryRate: { type: 'number' },
              readRate: { type: 'number' },
              responseRate: { type: 'number' },
              issues: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        categoryBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              templateCount: { type: 'number' },
              totalSent: { type: 'number' },
              avgDeliveryRate: { type: 'number' },
              avgReadRate: { type: 'number' },
              avgResponseRate: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for analytics (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for analytics (ISO format)' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  @ApiQuery({ name: 'language', required: false, type: String, description: 'Filter by language' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  async getAnalyticsSummary(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
    @Query('language') language?: string,
    @Query('status') status?: string,
  ) {
    const options: any = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);
    if (category) options.category = category;
    if (language) options.language = language;
    if (status) options.status = status;

    return this.templateAnalyticsService.getAnalyticsSummary(tenantId, options);
  }

  @Get('analytics/export')
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics data exported',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for export (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for export (ISO format)' })
  @ApiQuery({ name: 'templateIds', required: false, type: String, description: 'Comma-separated template IDs' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  @ApiQuery({ name: 'language', required: false, type: String, description: 'Filter by language' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'], description: 'Export format (default: json)' })
  async exportAnalytics(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('templateIds') templateIds?: string,
    @Query('category') category?: string,
    @Query('language') language?: string,
    @Query('format') format?: 'json' | 'csv',
  ) {
    const options: any = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);
    if (templateIds) options.templateIds = templateIds.split(',');
    if (category) options.category = category;
    if (language) options.language = language;
    if (format) options.format = format;

    return this.templateAnalyticsService.exportAnalytics(tenantId, options);
  }

  @Post('analytics/compare')
  @ApiOperation({ summary: 'Compare multiple templates for A/B testing' })
  @ApiResponse({ 
    status: 200, 
    description: 'Template comparison completed',
    schema: {
      type: 'object',
      properties: {
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
          },
        },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              templateId: { type: 'string' },
              templateName: { type: 'string' },
              category: { type: 'string' },
              language: { type: 'string' },
              metrics: {
                type: 'object',
                properties: {
                  totalSent: { type: 'number' },
                  deliveryRate: { type: 'number' },
                  readRate: { type: 'number' },
                  responseRate: { type: 'number' },
                },
              },
              performance: { type: 'string', enum: ['best', 'good', 'average', 'poor'] },
            },
          },
        },
        winner: {
          type: 'object',
          nullable: true,
          properties: {
            templateId: { type: 'string' },
            templateName: { type: 'string' },
            reason: { type: 'string' },
          },
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request (need at least 2 templates)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        templateIds: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
        },
        startDate: { type: 'string', format: 'date-time', nullable: true },
        endDate: { type: 'string', format: 'date-time', nullable: true },
      },
      required: ['templateIds'],
    },
  })
  async compareTemplates(
    @TenantId() tenantId: string,
    @Body('templateIds') templateIds: string[],
    @Body('startDate') startDate?: string,
    @Body('endDate') endDate?: string,
  ) {
    if (!templateIds || templateIds.length < 2) {
      throw new BadRequestException('At least 2 template IDs are required for comparison');
    }

    const options: any = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    return this.templateAnalyticsService.compareTemplates(tenantId, templateIds, options);
  }

  // Template Import/Export Endpoints

  @Post('import/preview')
  @ApiOperation({ 
    summary: 'Preview template import without actually importing',
    description: 'Validates templates and checks for duplicates before import. Returns a preview of what will be imported, skipped, or failed.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Import preview generated',
    schema: {
      type: 'object',
      properties: {
        totalTemplates: { type: 'number', description: 'Total number of templates in import file' },
        validTemplates: { type: 'number', description: 'Number of templates that will be imported' },
        invalidTemplates: { type: 'number', description: 'Number of templates with validation errors' },
        duplicates: { type: 'number', description: 'Number of duplicate templates' },
        templates: {
          type: 'array',
          description: 'Detailed preview of each template',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              displayName: { type: 'string', nullable: true },
              category: { type: 'string' },
              language: { type: 'string' },
              status: { 
                type: 'string', 
                enum: ['valid', 'invalid', 'duplicate'],
                description: 'Import status for this template',
              },
              errors: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Validation errors (if any)',
              },
              warnings: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Validation warnings (if any)',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid import file structure' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description: 'Import file (JSON) or template data',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'JSON file containing templates',
            },
            skipDuplicates: {
              type: 'boolean',
              description: 'Whether to skip templates with duplicate names',
              default: false,
            },
            namePrefix: {
              type: 'string',
              description: 'Prefix to add to all imported template names',
            },
          },
        },
        {
          type: 'object',
          properties: {
            templates: {
              type: 'array',
              items: { type: 'object' },
              description: 'Array of templates to import',
            },
            skipDuplicates: {
              type: 'boolean',
              description: 'Whether to skip templates with duplicate names',
              default: false,
            },
            namePrefix: {
              type: 'string',
              description: 'Prefix to add to all imported template names',
            },
          },
        },
      ],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(
    @TenantId() tenantId: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body('templates') templatesJson?: string,
    @Body('skipDuplicates') skipDuplicates?: boolean,
    @Body('namePrefix') namePrefix?: string,
  ) {
    let importData: any;

    // Handle file upload
    if (file) {
      try {
        const fileContent = file.buffer.toString('utf-8');
        importData = JSON.parse(fileContent);
      } catch (error) {
        throw new BadRequestException('Invalid JSON file');
      }
    } else if (templatesJson) {
      // Handle JSON body
      try {
        importData = typeof templatesJson === 'string' ? JSON.parse(templatesJson) : templatesJson;
      } catch (error) {
        throw new BadRequestException('Invalid JSON data');
      }
    } else {
      throw new BadRequestException('Either file or templates data is required');
    }

    // Validate file structure
    const validation = this.importExportService.validateImportFile(importData);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid import file structure',
        errors: validation.errors,
      });
    }

    // Extract templates from import data
    const templates = this.importExportService.extractTemplatesFromImportData(importData);

    // Generate preview
    return this.importExportService.generateImportPreview(tenantId, templates, {
      skipDuplicates: skipDuplicates === true || (skipDuplicates as any) === 'true',
      namePrefix,
    });
  }

  @Post('import')
  @ApiOperation({ 
    summary: 'Import templates from JSON file or data',
    description: 'Imports templates with validation and duplicate handling. Supports bulk import with error handling for individual templates.',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Templates imported successfully',
    schema: {
      type: 'object',
      properties: {
        imported: { type: 'number', description: 'Number of templates successfully imported' },
        skipped: { type: 'number', description: 'Number of templates skipped (duplicates)' },
        failed: { type: 'number', description: 'Number of templates that failed to import' },
        errors: {
          type: 'array',
          description: 'Errors for failed imports',
          items: {
            type: 'object',
            properties: {
              templateName: { type: 'string' },
              error: { type: 'string' },
              details: { type: 'object', nullable: true },
            },
          },
        },
        templates: {
          type: 'array',
          description: 'Successfully imported templates',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid import file or validation errors' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description: 'Import file (JSON) or template data with options',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'JSON file containing templates',
            },
            skipDuplicates: {
              type: 'boolean',
              description: 'Whether to skip templates with duplicate names',
              default: false,
            },
            createVersions: {
              type: 'boolean',
              description: 'Whether to create new versions for existing templates',
              default: false,
            },
            namePrefix: {
              type: 'string',
              description: 'Prefix to add to all imported template names',
            },
          },
        },
        {
          type: 'object',
          properties: {
            templates: {
              type: 'array',
              items: { type: 'object' },
              description: 'Array of templates to import',
            },
            skipDuplicates: {
              type: 'boolean',
              description: 'Whether to skip templates with duplicate names',
              default: false,
            },
            createVersions: {
              type: 'boolean',
              description: 'Whether to create new versions for existing templates',
              default: false,
            },
            namePrefix: {
              type: 'string',
              description: 'Prefix to add to all imported template names',
            },
          },
        },
      ],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importTemplates(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body('templates') templatesJson?: string,
    @Body('skipDuplicates') skipDuplicates?: boolean,
    @Body('createVersions') createVersions?: boolean,
    @Body('namePrefix') namePrefix?: string,
  ) {
    let importData: any;

    // Handle file upload
    if (file) {
      try {
        const fileContent = file.buffer.toString('utf-8');
        importData = JSON.parse(fileContent);
      } catch (error) {
        throw new BadRequestException('Invalid JSON file');
      }
    } else if (templatesJson) {
      // Handle JSON body
      try {
        importData = typeof templatesJson === 'string' ? JSON.parse(templatesJson) : templatesJson;
      } catch (error) {
        throw new BadRequestException('Invalid JSON data');
      }
    } else {
      throw new BadRequestException('Either file or templates data is required');
    }

    // Validate file structure
    const validation = this.importExportService.validateImportFile(importData);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid import file structure',
        errors: validation.errors,
      });
    }

    // Extract templates from import data
    const templates = this.importExportService.extractTemplatesFromImportData(importData);

    // Import templates
    return this.importExportService.importTemplates(tenantId, userId, templates, {
      skipDuplicates: skipDuplicates === true || (skipDuplicates as any) === 'true',
      createVersions: createVersions === true || (createVersions as any) === 'true',
      namePrefix,
    });
  }

  @Get('export')
  @ApiOperation({ 
    summary: 'Export templates to JSON format',
    description: 'Exports templates with optional analytics and history. Can export specific templates or all templates. Returns JSON data that can be imported later.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Templates exported successfully',
    schema: {
      type: 'object',
      properties: {
        templates: {
          type: 'array',
          description: 'Exported templates',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              displayName: { type: 'string', nullable: true },
              category: { type: 'string' },
              language: { type: 'string' },
              description: { type: 'string', nullable: true },
              components: { type: 'object' },
              sampleValues: { type: 'object' },
              metadata: {
                type: 'object',
                description: 'Template metadata (for reference, not imported)',
                properties: {
                  originalId: { type: 'string' },
                  status: { type: 'string' },
                  version: { type: 'number' },
                  qualityScore: { type: 'number', nullable: true },
                  usageCount: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
              analytics: { 
                type: 'object', 
                nullable: true,
                description: 'Template analytics (if includeAnalytics=true)',
              },
              statusHistory: { 
                type: 'array', 
                nullable: true,
                description: 'Status history (if includeHistory=true)',
              },
            },
          },
        },
        metadata: {
          type: 'object',
          properties: {
            exportedAt: { type: 'string', format: 'date-time' },
            totalTemplates: { type: 'number' },
            tenantId: { type: 'string' },
            includeAnalytics: { type: 'boolean' },
            includeHistory: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiQuery({ 
    name: 'templateIds', 
    required: false, 
    type: String, 
    description: 'Comma-separated template IDs to export. If not provided, exports all templates.',
  })
  @ApiQuery({ 
    name: 'includeArchived', 
    required: false, 
    type: Boolean, 
    description: 'Whether to include archived templates in export',
    example: false,
  })
  @ApiQuery({ 
    name: 'includeAnalytics', 
    required: false, 
    type: Boolean, 
    description: 'Whether to include template analytics in export',
    example: false,
  })
  @ApiQuery({ 
    name: 'includeHistory', 
    required: false, 
    type: Boolean, 
    description: 'Whether to include status history in export',
    example: false,
  })
  async exportTemplates(
    @TenantId() tenantId: string,
    @Query('templateIds') templateIds?: string,
    @Query('includeArchived') includeArchived?: boolean,
    @Query('includeAnalytics') includeAnalytics?: boolean,
    @Query('includeHistory') includeHistory?: boolean,
  ) {
    const options: any = {
      includeArchived: includeArchived === true || (includeArchived as any) === 'true',
      includeAnalytics: includeAnalytics === true || (includeAnalytics as any) === 'true',
      includeHistory: includeHistory === true || (includeHistory as any) === 'true',
    };

    if (templateIds) {
      options.templateIds = templateIds.split(',').map(id => id.trim());
    }

    return this.importExportService.exportTemplates(tenantId, options);
  }

  @Post('export')
  @ApiOperation({ 
    summary: 'Export templates to JSON format (POST method for complex filters)',
    description: 'Same as GET /export but allows more complex filtering via request body.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Templates exported successfully',
  })
  @ApiBody({
    type: ExportTemplatesDto,
    description: 'Export options',
  })
  async exportTemplatesPost(
    @TenantId() tenantId: string,
    @Body() exportDto: ExportTemplatesDto,
  ) {
    return this.importExportService.exportTemplates(tenantId, {
      templateIds: exportDto.templateIds,
      includeArchived: exportDto.includeArchived,
      includeAnalytics: exportDto.includeAnalytics,
      includeHistory: exportDto.includeHistory,
    });
  }

  // Campaign Usage Tracking Endpoints

  @Get(':id/campaigns')
  @ApiOperation({ 
    summary: 'Get all campaigns using a specific template',
    description: 'Returns all campaigns (active and inactive) that use the specified template. Requirement 19.6: Track which templates are used in which campaigns.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Campaigns retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'failed'] },
          createdAt: { type: 'string', format: 'date-time' },
          startedAt: { type: 'string', format: 'date-time', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          totalRecipients: { type: 'number' },
          sentCount: { type: 'number' },
          deliveredCount: { type: 'number' },
          readCount: { type: 'number' },
          failedCount: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiQuery({ 
    name: 'activeOnly', 
    required: false, 
    type: Boolean, 
    description: 'If true, only return active campaigns (running, scheduled, or paused)',
  })
  async getCampaignsUsingTemplate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.templatesService.getCampaignsUsingTemplate(
      tenantId,
      id,
      activeOnly === true || (activeOnly as any) === 'true',
    );
  }

  @Get(':id/usage-stats')
  @ApiOperation({ 
    summary: 'Get comprehensive usage statistics for a template',
    description: 'Returns usage statistics including campaign usage, message counts, and performance metrics. Requirement 19.6: Track which templates are used in which campaigns.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usage statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        templateId: { type: 'string' },
        templateName: { type: 'string' },
        usageCount: { type: 'number', description: 'Total number of times template has been used' },
        lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
        totalCampaigns: { type: 'number', description: 'Total number of campaigns using this template' },
        activeCampaigns: { type: 'number', description: 'Number of active campaigns (running, scheduled, paused)' },
        completedCampaigns: { type: 'number', description: 'Number of completed campaigns' },
        campaigns: {
          type: 'array',
          description: 'List of all campaigns using this template',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              startedAt: { type: 'string', format: 'date-time', nullable: true },
              completedAt: { type: 'string', format: 'date-time', nullable: true },
              totalRecipients: { type: 'number' },
              sentCount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplateUsageStats(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.templatesService.getTemplateUsageStats(tenantId, id);
  }

  @Get(':id/can-delete')
  @ApiOperation({ 
    summary: 'Check if a template can be deleted',
    description: 'Validates whether a template can be safely deleted by checking approval status and active campaign usage. Requirement 19.7: Prevent deletion of templates in active campaigns.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Deletion check completed',
    schema: {
      type: 'object',
      properties: {
        canDelete: { 
          type: 'boolean', 
          description: 'Whether the template can be deleted',
        },
        reason: { 
          type: 'string', 
          nullable: true,
          description: 'Reason why template cannot be deleted (if canDelete is false)',
        },
        activeCampaigns: {
          type: 'array',
          nullable: true,
          description: 'List of active campaigns using this template (if any)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async canDeleteTemplate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.templatesService.canDeleteTemplate(tenantId, id);
  }

  // ==================== Cache Management Endpoints ====================

  @Get('cache/stats')
  @TemplatePermissions(TemplatePermission.READ)
  @ApiOperation({ 
    summary: 'Get template cache statistics',
    description: 'Returns statistics about template caching including total keys, hit rates, and memory usage. Useful for monitoring cache performance.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache statistics retrieved',
    schema: {
      type: 'object',
      properties: {
        totalKeys: { type: 'number', description: 'Total number of cached template keys' },
        templateKeys: { type: 'number', description: 'Number of individual template caches' },
        listKeys: { type: 'number', description: 'Number of template list caches' },
        validationKeys: { type: 'number', description: 'Number of validation result caches' },
        previewKeys: { type: 'number', description: 'Number of preview caches' },
      },
    },
  })
  async getCacheStats() {
    return this.templatesService.getCacheStats();
  }

  @Delete('cache/clear')
  @TemplatePermissions(TemplatePermission.DELETE)
  @ApiOperation({ 
    summary: 'Clear all template caches',
    description: 'Clears all template-related caches including lists, individual templates, validations, and previews. Use with caution as this will impact performance temporarily.',
  })
  @ApiResponse({ status: 200, description: 'All template caches cleared' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async clearAllCaches() {
    await this.templatesService.clearAllCaches();
    return { 
      success: true, 
      message: 'All template caches cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id/cache')
  @TemplatePermissions(TemplatePermission.UPDATE)
  @ApiOperation({ 
    summary: 'Clear cache for a specific template',
    description: 'Clears all caches related to a specific template including the template itself, its previews, and analytics.',
  })
  @ApiResponse({ status: 200, description: 'Template cache cleared' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async clearTemplateCache(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.templatesService.clearTemplateCache(tenantId, id);
    return { 
      success: true, 
      message: `Cache cleared for template ${id}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fetch all templates from Meta
   */
  @Get('meta/fetch-all')
  @ApiOperation({ 
    summary: 'Fetch all templates from Meta',
    description: 'Retrieves all templates from Meta WhatsApp Business API for the current tenant.',
  })
  @ApiResponse({ status: 200, description: 'Templates fetched successfully' })
  async fetchAllFromMeta(@TenantId() tenantId: string) {
    return this.metaTemplateApiService.fetchAllTemplatesFromMeta(tenantId);
  }

  /**
   * Sync templates from Meta
   */
  @Post('meta/sync')
  @ApiOperation({ 
    summary: 'Sync templates from Meta',
    description: 'Synchronizes template statuses from Meta WhatsApp Business API with local database.',
  })
  @ApiResponse({ status: 200, description: 'Templates synced successfully' })
  async syncFromMeta(@TenantId() tenantId: string) {
    return this.templatesService.syncTemplatesFromMeta(tenantId);
  }

  /**
   * Get template status from Meta
   */
  @Get(':id/meta-status')
  @ApiOperation({ 
    summary: 'Get template status from Meta',
    description: 'Fetches the current status of a specific template from Meta WhatsApp Business API.',
  })
  @ApiResponse({ status: 200, description: 'Template status fetched successfully' })
  @ApiResponse({ status: 400, description: 'Template has not been submitted to Meta' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getMetaStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const template = await this.templatesService.findOne(tenantId, id);
    
    if (!template.metaTemplateId) {
      throw new BadRequestException('Template has not been submitted to Meta');
    }

    return this.metaTemplateApiService.getTemplateStatus(tenantId, template.metaTemplateId);
  }
}

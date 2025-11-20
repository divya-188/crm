import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { TenantId } from '../../../common/decorators/tenant-id.decorator';
import { TemplateCursorPaginationService } from '../services/template-cursor-pagination.service';
import { TemplateQueryOptimizerService } from '../services/template-query-optimizer.service';

/**
 * Controller for optimized template queries
 * Task 59: Optimize database queries
 * 
 * Provides endpoints for:
 * - Cursor-based pagination
 * - Performance analytics using database views
 * - Optimized batch operations
 * 
 * Requirements: Performance targets
 */
@ApiTags('Templates - Optimization')
@Controller('templates/optimized')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TemplateOptimizationController {
  constructor(
    private readonly cursorPaginationService: TemplateCursorPaginationService,
    private readonly queryOptimizerService: TemplateQueryOptimizerService,
  ) {}

  @Get('cursor-paginate')
  @ApiOperation({
    summary: 'Get templates with cursor-based pagination',
    description:
      'More efficient than offset pagination for large datasets. Uses keyset pagination technique.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (max 100)' })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'usageCount', 'qualityScore', 'approvedAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({
    status: 200,
    description: 'Templates with cursor pagination info',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        pageInfo: {
          type: 'object',
          properties: {
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
            startCursor: { type: 'string', nullable: true },
            endCursor: { type: 'string', nullable: true },
          },
        },
      },
    },
  })
  async cursorPaginate(
    @TenantId() tenantId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('language') language?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('sortBy') sortBy?: 'createdAt' | 'usageCount' | 'qualityScore' | 'approvedAt',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.cursorPaginationService.paginateTemplates({
      tenantId,
      limit,
      cursor,
      status,
      category,
      language,
      search,
      isActive,
      sortBy,
      sortOrder,
    });
  }

  @Get('performance-summary')
  @ApiOperation({
    summary: 'Get template performance summary',
    description: 'Uses optimized database view for fast aggregation of template metrics',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'minUsage', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Template performance summary with 30-day metrics',
  })
  async getPerformanceSummary(
    @TenantId() tenantId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('minUsage', new DefaultValuePipe(0), ParseIntPipe) minUsage: number,
  ) {
    return this.queryOptimizerService.getTemplatePerformanceSummary(tenantId, {
      limit,
      offset,
      minUsage,
    });
  }

  @Get('daily-analytics')
  @ApiOperation({
    summary: 'Get daily analytics summary',
    description: 'Aggregated daily metrics using optimized database view',
  })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'YYYY-MM-DD' })
  @ApiResponse({
    status: 200,
    description: 'Daily analytics summary',
  })
  async getDailyAnalytics(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.queryOptimizerService.getDailyAnalyticsSummary(tenantId, start, end);
  }

  @Get('top-performing')
  @ApiOperation({
    summary: 'Get top performing templates',
    description: 'Uses optimized view with performance scoring algorithm',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of templates' })
  @ApiResponse({
    status: 200,
    description: 'Top performing templates with performance scores',
  })
  async getTopPerforming(
    @TenantId() tenantId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.queryOptimizerService.getTopPerformingTemplates(tenantId, limit);
  }

  @Get('low-performing')
  @ApiOperation({
    summary: 'Get low performing templates',
    description: 'Identifies templates that need attention based on delivery, read, and response rates',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Low performing templates with identified issues',
  })
  async getLowPerforming(
    @TenantId() tenantId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.queryOptimizerService.getLowPerformingTemplates(tenantId, limit);
  }

  @Get('category-performance')
  @ApiOperation({
    summary: 'Get performance comparison by category',
    description: 'Aggregated metrics grouped by template category',
  })
  @ApiResponse({
    status: 200,
    description: 'Category performance comparison',
  })
  async getCategoryPerformance(@TenantId() tenantId: string) {
    return this.queryOptimizerService.getCategoryPerformance(tenantId);
  }

  @Get('language-performance')
  @ApiOperation({
    summary: 'Get performance comparison by language',
    description: 'Aggregated metrics grouped by template language',
  })
  @ApiResponse({
    status: 200,
    description: 'Language performance comparison',
  })
  async getLanguagePerformance(@TenantId() tenantId: string) {
    return this.queryOptimizerService.getLanguagePerformance(tenantId);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get template statistics',
    description: 'Optimized single-query statistics for dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Template statistics by status, category, and language',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        byStatus: { type: 'object' },
        byCategory: { type: 'object' },
        byLanguage: { type: 'object' },
      },
    },
  })
  async getStatistics(@TenantId() tenantId: string) {
    return this.queryOptimizerService.getTemplateStatistics(tenantId);
  }

  @Get('in-active-campaigns')
  @ApiOperation({
    summary: 'Get templates used in active campaigns',
    description: 'Efficiently checks which templates are in use (prevents deletion)',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of template IDs in active campaigns',
  })
  async getTemplatesInActiveCampaigns(@TenantId() tenantId: string) {
    const templateIds = await this.queryOptimizerService.getTemplatesInActiveCampaigns(tenantId);
    return { templateIds };
  }
}

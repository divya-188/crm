import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Template } from '../entities/template.entity';

/**
 * Cursor-based pagination service for templates
 * Task 59: Optimize database queries - Add cursor-based pagination for large datasets
 * 
 * Cursor-based pagination is more efficient than offset-based pagination for large datasets
 * because it doesn't require counting all rows and doesn't suffer from page drift.
 * 
 * Requirements: Performance targets
 */

export interface CursorPaginationOptions {
  tenantId: string;
  limit?: number;
  cursor?: string; // Base64 encoded cursor
  status?: string;
  category?: string;
  language?: string;
  search?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'usageCount' | 'qualityScore' | 'approvedAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CursorPaginationResult<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount?: number; // Optional, only calculated if requested
}

interface DecodedCursor {
  sortValue: any;
  id: string;
}

@Injectable()
export class TemplateCursorPaginationService {
  private readonly logger = new Logger(TemplateCursorPaginationService.name);
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
  ) {}

  /**
   * Paginate templates using cursor-based pagination
   * More efficient for large datasets than offset-based pagination
   */
  async paginateTemplates(
    options: CursorPaginationOptions,
  ): Promise<CursorPaginationResult<Template>> {
    const {
      tenantId,
      limit = this.DEFAULT_LIMIT,
      cursor,
      status,
      category,
      language,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    // Validate and cap limit
    const pageSize = Math.min(limit, this.MAX_LIMIT);

    this.logger.debug(
      `Cursor pagination: tenant=${tenantId}, limit=${pageSize}, cursor=${cursor ? 'present' : 'none'}`,
    );

    // Build base query
    const query = this.buildBaseQuery(tenantId, {
      status,
      category,
      language,
      search,
      isActive,
    });

    // Apply cursor filtering if provided
    if (cursor) {
      const decodedCursor = this.decodeCursor(cursor);
      this.applyCursorFilter(query, decodedCursor, sortBy, sortOrder);
    }

    // Apply sorting
    this.applySorting(query, sortBy, sortOrder);

    // Fetch one extra record to determine if there's a next page
    query.take(pageSize + 1);

    // Execute query
    const templates = await query.getMany();

    // Determine if there are more pages
    const hasNextPage = templates.length > pageSize;
    if (hasNextPage) {
      templates.pop(); // Remove the extra record
    }

    // Generate cursors
    const startCursor = templates.length > 0 ? this.encodeCursor(templates[0], sortBy) : null;
    const endCursor =
      templates.length > 0 ? this.encodeCursor(templates[templates.length - 1], sortBy) : null;

    return {
      data: templates,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!cursor, // If cursor exists, there's a previous page
        startCursor,
        endCursor,
      },
    };
  }

  /**
   * Get total count (expensive operation, use sparingly)
   */
  async getTotalCount(options: Omit<CursorPaginationOptions, 'cursor' | 'limit'>): Promise<number> {
    const { tenantId, status, category, language, search, isActive } = options;

    const query = this.buildBaseQuery(tenantId, {
      status,
      category,
      language,
      search,
      isActive,
    });

    return query.getCount();
  }

  /**
   * Build base query with filters
   */
  private buildBaseQuery(
    tenantId: string,
    filters: {
      status?: string;
      category?: string;
      language?: string;
      search?: string;
      isActive?: boolean;
    },
  ): SelectQueryBuilder<Template> {
    const { status, category, language, search, isActive } = filters;

    const query = this.templatesRepository
      .createQueryBuilder('template')
      .where('template.tenantId = :tenantId', { tenantId });

    // Apply filters
    if (status) {
      query.andWhere('template.status = :status', { status });
    }

    if (category) {
      query.andWhere('template.category = :category', { category });
    }

    if (language) {
      query.andWhere('template.language = :language', { language });
    }

    if (isActive !== undefined) {
      query.andWhere('template.isActive = :isActive', { isActive });
    }

    // Apply full-text search
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

    return query;
  }

  /**
   * Apply cursor-based filtering
   * Uses keyset pagination technique for efficient large dataset traversal
   */
  private applyCursorFilter(
    query: SelectQueryBuilder<Template>,
    cursor: DecodedCursor,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    const { sortValue, id } = cursor;
    const sortField = `template.${sortBy}`;

    if (sortOrder === 'DESC') {
      // For descending order: (sortValue, id) < (cursor.sortValue, cursor.id)
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`${sortField} < :sortValue`, { sortValue })
            .orWhere(
              new Brackets((innerQb) => {
                innerQb
                  .where(`${sortField} = :sortValue`, { sortValue })
                  .andWhere('template.id < :id', { id });
              }),
            );
        }),
      );
    } else {
      // For ascending order: (sortValue, id) > (cursor.sortValue, cursor.id)
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`${sortField} > :sortValue`, { sortValue })
            .orWhere(
              new Brackets((innerQb) => {
                innerQb
                  .where(`${sortField} = :sortValue`, { sortValue })
                  .andWhere('template.id > :id', { id });
              }),
            );
        }),
      );
    }
  }

  /**
   * Apply sorting with tie-breaker
   */
  private applySorting(
    query: SelectQueryBuilder<Template>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    const sortField = `template.${sortBy}`;
    query.orderBy(sortField, sortOrder);

    // Add id as tie-breaker for consistent ordering
    query.addOrderBy('template.id', sortOrder);
  }

  /**
   * Encode cursor from template and sort field
   */
  private encodeCursor(template: Template, sortBy: string): string {
    const sortValue = template[sortBy];
    const cursorData: DecodedCursor = {
      sortValue: sortValue instanceof Date ? sortValue.toISOString() : sortValue,
      id: template.id,
    };

    const jsonString = JSON.stringify(cursorData);
    return Buffer.from(jsonString).toString('base64');
  }

  /**
   * Decode cursor to extract sort value and id
   */
  private decodeCursor(cursor: string): DecodedCursor {
    try {
      const jsonString = Buffer.from(cursor, 'base64').toString('utf-8');
      const decoded = JSON.parse(jsonString) as DecodedCursor;

      // Validate cursor structure
      if (!decoded.id || decoded.sortValue === undefined) {
        throw new Error('Invalid cursor structure');
      }

      return decoded;
    } catch (error) {
      this.logger.error(`Failed to decode cursor: ${error.message}`);
      throw new Error('Invalid cursor format');
    }
  }

  /**
   * Helper method to paginate backwards (previous page)
   * This reverses the sort order and cursor logic
   */
  async paginateBackwards(
    options: CursorPaginationOptions,
  ): Promise<CursorPaginationResult<Template>> {
    const reversedSortOrder = options.sortOrder === 'ASC' ? 'DESC' : 'ASC';

    const result = await this.paginateTemplates({
      ...options,
      sortOrder: reversedSortOrder,
    });

    // Reverse the results to maintain original sort order
    result.data.reverse();

    // Swap page info
    const { hasNextPage, hasPreviousPage, startCursor, endCursor } = result.pageInfo;
    result.pageInfo = {
      hasNextPage: hasPreviousPage,
      hasPreviousPage: hasNextPage,
      startCursor: endCursor,
      endCursor: startCursor,
    };

    return result;
  }
}

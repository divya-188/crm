import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/services/redis.service';
import { Template } from '../entities/template.entity';
import { ValidationResult } from './template-validation.engine';

/**
 * Template Cache Service
 * Implements comprehensive caching strategy for templates
 * Requirements: Task 58 - Performance Optimization
 */
@Injectable()
export class TemplateCacheService {
  private readonly logger = new Logger(TemplateCacheService.name);
  private readonly prefix = 'templates:';

  // Cache TTL values (in seconds)
  private readonly TTL = {
    TEMPLATE_LIST: 5 * 60, // 5 minutes
    TEMPLATE: 15 * 60, // 15 minutes
    VALIDATION: 60 * 60, // 1 hour
    PREVIEW: 10 * 60, // 10 minutes
    STATUS: 5 * 60, // 5 minutes
    ANALYTICS: 60 * 60, // 1 hour
    METADATA: 24 * 60 * 60, // 24 hours
  };

  constructor(private redisService: RedisService) {}

  // ==================== Template List Caching ====================

  /**
   * Get cached template list
   * @param tenantId Tenant ID
   * @param filters Filter parameters
   * @returns Cached template list or null
   */
  async getTemplateList(
    tenantId: string,
    filters: Record<string, any>,
  ): Promise<{
    data: Template[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  } | null> {
    try {
      const key = this.getTemplateListKey(tenantId, filters);
      const cached = await this.redisService.get<{
        data: Template[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
      }>(key);

      if (cached) {
        this.logger.debug(`Template list cache hit: ${key}`);
      }

      return cached;
    } catch (error) {
      this.logger.error(`Failed to get template list from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache template list
   * @param tenantId Tenant ID
   * @param filters Filter parameters
   * @param data Template list data
   */
  async setTemplateList(
    tenantId: string,
    filters: Record<string, any>,
    data: {
      data: Template[];
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    },
  ): Promise<void> {
    try {
      const key = this.getTemplateListKey(tenantId, filters);
      await this.redisService.set(key, data, this.TTL.TEMPLATE_LIST);
      this.logger.debug(`Template list cached: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to cache template list: ${error.message}`);
    }
  }

  /**
   * Invalidate all template list caches for a tenant
   * @param tenantId Tenant ID
   */
  async invalidateTemplateList(tenantId: string): Promise<void> {
    try {
      const pattern = this.getFullKey(`${tenantId}:list:*`);
      await this.redisService.delPattern(pattern);
      this.logger.log(`Invalidated template list cache for tenant: ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate template list cache: ${error.message}`);
    }
  }

  // ==================== Individual Template Caching ====================

  /**
   * Get cached template
   * @param templateId Template ID
   * @returns Cached template or null
   */
  async getTemplate(templateId: string): Promise<Template | null> {
    try {
      const key = this.getTemplateKey(templateId);
      const cached = await this.redisService.get<Template>(key);

      if (cached) {
        this.logger.debug(`Template cache hit: ${templateId}`);
      }

      return cached;
    } catch (error) {
      this.logger.error(`Failed to get template from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache individual template
   * @param template Template to cache
   */
  async setTemplate(template: Template): Promise<void> {
    try {
      const key = this.getTemplateKey(template.id);
      await this.redisService.set(key, template, this.TTL.TEMPLATE);
      this.logger.debug(`Template cached: ${template.id}`);
    } catch (error) {
      this.logger.error(`Failed to cache template: ${error.message}`);
    }
  }

  /**
   * Invalidate specific template cache
   * @param templateId Template ID
   * @param tenantId Tenant ID (for list invalidation)
   */
  async invalidateTemplate(templateId: string, tenantId: string): Promise<void> {
    try {
      // Invalidate specific template
      const templateKey = this.getTemplateKey(templateId);
      await this.redisService.del(templateKey);

      // Invalidate template list (all filter combinations)
      await this.invalidateTemplateList(tenantId);

      // Invalidate preview cache
      await this.invalidatePreview(templateId);

      // Invalidate analytics
      await this.invalidateAnalytics(templateId);

      this.logger.log(`Invalidated template cache: ${templateId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate template cache: ${error.message}`);
    }
  }

  // ==================== Validation Result Caching ====================

  /**
   * Get cached validation result
   * @param templateData Template data to validate
   * @returns Cached validation result or null
   */
  async getValidationResult(templateData: any): Promise<ValidationResult | null> {
    try {
      const hash = this.hashTemplateData(templateData);
      const key = this.getValidationKey(hash);
      const cached = await this.redisService.get<ValidationResult>(key);

      if (cached) {
        this.logger.debug(`Validation cache hit: ${hash}`);
      }

      return cached;
    } catch (error) {
      this.logger.error(`Failed to get validation result from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache validation result
   * @param templateData Template data
   * @param result Validation result
   */
  async setValidationResult(templateData: any, result: ValidationResult): Promise<void> {
    try {
      const hash = this.hashTemplateData(templateData);
      const key = this.getValidationKey(hash);
      await this.redisService.set(key, result, this.TTL.VALIDATION);
      this.logger.debug(`Validation result cached: ${hash}`);
    } catch (error) {
      this.logger.error(`Failed to cache validation result: ${error.message}`);
    }
  }

  // ==================== Preview Caching ====================

  /**
   * Get cached preview
   * @param templateId Template ID
   * @param sampleValues Sample values for placeholders
   * @returns Cached preview or null
   */
  async getPreview(
    templateId: string,
    sampleValues: Record<string, string>,
  ): Promise<string | null> {
    try {
      const hash = this.hashSampleValues(sampleValues);
      const key = this.getPreviewKey(templateId, hash);
      const cached = await this.redisService.get<string>(key);

      if (cached) {
        this.logger.debug(`Preview cache hit: ${templateId}:${hash}`);
      }

      return cached;
    } catch (error) {
      this.logger.error(`Failed to get preview from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache preview
   * @param templateId Template ID
   * @param sampleValues Sample values
   * @param preview Preview HTML/text
   */
  async setPreview(
    templateId: string,
    sampleValues: Record<string, string>,
    preview: string,
  ): Promise<void> {
    try {
      const hash = this.hashSampleValues(sampleValues);
      const key = this.getPreviewKey(templateId, hash);
      await this.redisService.set(key, preview, this.TTL.PREVIEW);
      this.logger.debug(`Preview cached: ${templateId}:${hash}`);
    } catch (error) {
      this.logger.error(`Failed to cache preview: ${error.message}`);
    }
  }

  /**
   * Invalidate all preview caches for a template
   * @param templateId Template ID
   */
  async invalidatePreview(templateId: string): Promise<void> {
    try {
      const pattern = this.getFullKey(`preview:${templateId}:*`);
      await this.redisService.delPattern(pattern);
      this.logger.debug(`Invalidated preview cache for template: ${templateId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate preview cache: ${error.message}`);
    }
  }

  // ==================== Template Status Caching ====================

  /**
   * Get cached template status
   * @param metaTemplateId Meta template ID
   * @returns Cached status or null
   */
  async getTemplateStatus(metaTemplateId: string): Promise<any | null> {
    try {
      const key = this.getStatusKey(metaTemplateId);
      const cached = await this.redisService.get<any>(key);

      if (cached) {
        this.logger.debug(`Status cache hit: ${metaTemplateId}`);
      }

      return cached;
    } catch (error) {
      this.logger.error(`Failed to get status from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache template status
   * @param metaTemplateId Meta template ID
   * @param status Status data
   */
  async setTemplateStatus(metaTemplateId: string, status: any): Promise<void> {
    try {
      const key = this.getStatusKey(metaTemplateId);
      await this.redisService.set(key, status, this.TTL.STATUS);
      this.logger.debug(`Status cached: ${metaTemplateId}`);
    } catch (error) {
      this.logger.error(`Failed to cache status: ${error.message}`);
    }
  }

  // ==================== Analytics Caching ====================

  /**
   * Get cached analytics
   * @param templateId Template ID
   * @param dateRange Date range string
   * @returns Cached analytics or null
   */
  async getAnalytics(templateId: string, dateRange: string): Promise<any | null> {
    try {
      const key = this.getAnalyticsKey(templateId, dateRange);
      const cached = await this.redisService.get<any>(key);

      if (cached) {
        this.logger.debug(`Analytics cache hit: ${templateId}:${dateRange}`);
      }

      return cached;
    } catch (error) {
      this.logger.error(`Failed to get analytics from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache analytics
   * @param templateId Template ID
   * @param dateRange Date range string
   * @param analytics Analytics data
   */
  async setAnalytics(templateId: string, dateRange: string, analytics: any): Promise<void> {
    try {
      const key = this.getAnalyticsKey(templateId, dateRange);
      await this.redisService.set(key, analytics, this.TTL.ANALYTICS);
      this.logger.debug(`Analytics cached: ${templateId}:${dateRange}`);
    } catch (error) {
      this.logger.error(`Failed to cache analytics: ${error.message}`);
    }
  }

  /**
   * Invalidate analytics cache for a template
   * @param templateId Template ID
   */
  async invalidateAnalytics(templateId: string): Promise<void> {
    try {
      const pattern = this.getFullKey(`analytics:${templateId}:*`);
      await this.redisService.delPattern(pattern);
      this.logger.debug(`Invalidated analytics cache for template: ${templateId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate analytics cache: ${error.message}`);
    }
  }

  // ==================== Metadata Caching ====================

  /**
   * Get cached categories
   * @returns Cached categories or null
   */
  async getCategories(): Promise<any | null> {
    try {
      const key = this.getMetadataKey('categories');
      return await this.redisService.get<any>(key);
    } catch (error) {
      this.logger.error(`Failed to get categories from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache categories
   * @param categories Categories data
   */
  async setCategories(categories: any): Promise<void> {
    try {
      const key = this.getMetadataKey('categories');
      await this.redisService.set(key, categories, this.TTL.METADATA);
      this.logger.debug('Categories cached');
    } catch (error) {
      this.logger.error(`Failed to cache categories: ${error.message}`);
    }
  }

  /**
   * Get cached languages
   * @returns Cached languages or null
   */
  async getLanguages(): Promise<any | null> {
    try {
      const key = this.getMetadataKey('languages');
      return await this.redisService.get<any>(key);
    } catch (error) {
      this.logger.error(`Failed to get languages from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache languages
   * @param languages Languages data
   */
  async setLanguages(languages: any): Promise<void> {
    try {
      const key = this.getMetadataKey('languages');
      await this.redisService.set(key, languages, this.TTL.METADATA);
      this.logger.debug('Languages cached');
    } catch (error) {
      this.logger.error(`Failed to cache languages: ${error.message}`);
    }
  }

  // ==================== Cache Key Generators ====================

  private getTemplateListKey(tenantId: string, filters: Record<string, any>): string {
    const filterHash = this.hashFilters(filters);
    return `${tenantId}:list:${filterHash}`;
  }

  private getTemplateKey(templateId: string): string {
    return `template:${templateId}`;
  }

  private getValidationKey(hash: string): string {
    return `validation:${hash}`;
  }

  private getPreviewKey(templateId: string, hash: string): string {
    return `preview:${templateId}:${hash}`;
  }

  private getStatusKey(metaTemplateId: string): string {
    return `status:${metaTemplateId}`;
  }

  private getAnalyticsKey(templateId: string, dateRange: string): string {
    return `analytics:${templateId}:${dateRange}`;
  }

  private getMetadataKey(type: string): string {
    return `metadata:${type}`;
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // ==================== Utility Methods ====================

  /**
   * Hash template data for validation caching
   * @param templateData Template data
   * @returns Hash string
   */
  private hashTemplateData(templateData: any): string {
    try {
      // Create a stable string representation
      const normalized = JSON.stringify(templateData, Object.keys(templateData).sort());
      return this.simpleHash(normalized);
    } catch (error) {
      this.logger.error(`Failed to hash template data: ${error.message}`);
      return Date.now().toString();
    }
  }

  /**
   * Hash sample values for preview caching
   * @param sampleValues Sample values
   * @returns Hash string
   */
  private hashSampleValues(sampleValues: Record<string, string>): string {
    try {
      const normalized = JSON.stringify(sampleValues, Object.keys(sampleValues).sort());
      return this.simpleHash(normalized);
    } catch (error) {
      this.logger.error(`Failed to hash sample values: ${error.message}`);
      return Date.now().toString();
    }
  }

  /**
   * Hash filters for list caching
   * @param filters Filter parameters
   * @returns Hash string
   */
  private hashFilters(filters: Record<string, any>): string {
    try {
      const normalized = JSON.stringify(filters, Object.keys(filters).sort());
      return this.simpleHash(normalized);
    } catch (error) {
      this.logger.error(`Failed to hash filters: ${error.message}`);
      return Date.now().toString();
    }
  }

  /**
   * Simple hash function for cache keys
   * @param str String to hash
   * @returns Hash string
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if cache is available
   * @returns True if Redis is connected
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.redisService.ping();
      return true;
    } catch (error) {
      this.logger.warn('Template cache is not available');
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns Cache stats
   */
  async getStats(): Promise<{
    totalKeys: number;
    templateKeys: number;
    listKeys: number;
    validationKeys: number;
    previewKeys: number;
  }> {
    try {
      const pattern = this.getFullKey('*');
      const allKeys = await this.redisService.keys(pattern);

      const templateKeys = allKeys.filter((k) => k.includes(':template:')).length;
      const listKeys = allKeys.filter((k) => k.includes(':list:')).length;
      const validationKeys = allKeys.filter((k) => k.includes(':validation:')).length;
      const previewKeys = allKeys.filter((k) => k.includes(':preview:')).length;

      return {
        totalKeys: allKeys.length,
        templateKeys,
        listKeys,
        validationKeys,
        previewKeys,
      };
    } catch (error) {
      this.logger.error(`Failed to get cache stats: ${error.message}`);
      return {
        totalKeys: 0,
        templateKeys: 0,
        listKeys: 0,
        validationKeys: 0,
        previewKeys: 0,
      };
    }
  }

  /**
   * Clear all template caches
   */
  async clearAll(): Promise<void> {
    try {
      const pattern = this.getFullKey('*');
      await this.redisService.delPattern(pattern);
      this.logger.log('All template caches cleared');
    } catch (error) {
      this.logger.error(`Failed to clear all caches: ${error.message}`);
    }
  }
}

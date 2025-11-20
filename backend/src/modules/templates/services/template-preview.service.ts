import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../entities/template.entity';
import { TemplateCacheService } from './template-cache.service';

/**
 * Template Preview Service
 * 
 * Generates WhatsApp-style previews of templates with placeholder replacement,
 * media support, and button rendering. Implements Redis caching for performance.
 * 
 * Requirements:
 * - 6.2: Template Preview Generator SHALL render template exactly as it appears in WhatsApp
 * - 6.3: Template Preview Generator SHALL replace placeholders with sample values
 * - 6.6: Template Preview Generator SHALL show media previews for HEADER media components
 * - 6.7: WHEN sample values are updated, Template Preview Generator SHALL refresh preview within 500ms
 * - Task 58: Implements Redis caching for preview generation
 */
@Injectable()
export class TemplatePreviewService {
  private readonly logger = new Logger(TemplatePreviewService.name);
  // Keep in-memory cache as fallback
  private readonly previewCache = new Map<string, { preview: any; timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
    private cacheService: TemplateCacheService,
  ) {}

  /**
   * Generate a complete preview of a template
   * 
   * @param templateId - Template ID to preview
   * @param sampleValues - Optional override sample values
   * @returns Complete preview object with rendered components
   */
  async generatePreview(
    templateId: string,
    sampleValues?: Record<string, string>,
  ): Promise<{
    header?: {
      type: string;
      content: string;
      mediaUrl?: string;
    };
    body: string;
    footer?: string;
    buttons?: Array<{
      type: string;
      text: string;
      url?: string;
      phoneNumber?: string;
    }>;
    metadata: {
      templateName: string;
      category: string;
      language: string;
      timestamp: string;
    };
  }> {
    this.logger.log(`Generating preview for template: ${templateId}`);

    // Use provided sample values or fetch template to get default values
    const valuesToUse = sampleValues || {};

    // Check Redis cache first
    const cachedPreview = await this.cacheService.getPreview(templateId, valuesToUse);
    if (cachedPreview) {
      this.logger.log(`Returning cached preview from Redis for template: ${templateId}`);
      try {
        return JSON.parse(cachedPreview);
      } catch (error) {
        this.logger.warn(`Failed to parse cached preview: ${error.message}`);
      }
    }

    // Check in-memory cache as fallback
    const cacheKey = this.getCacheKey(templateId, valuesToUse);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.log(`Returning cached preview from memory for template: ${templateId}`);
      return cached;
    }

    // Fetch template
    const template = await this.templatesRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new BadRequestException(`Template with ID ${templateId} not found`);
    }

    // Merge provided sample values with template's sample values
    const finalValues = { ...template.sampleValues, ...valuesToUse };

    // Generate preview
    const preview = {
      header: this.renderHeader(template, finalValues),
      body: this.renderBody(template, finalValues),
      footer: this.renderFooter(template),
      buttons: this.renderButtons(template),
      metadata: {
        templateName: template.displayName || template.name,
        category: template.category,
        language: template.language,
        timestamp: new Date().toISOString(),
      },
    };

    // Cache the result in Redis
    await this.cacheService.setPreview(templateId, valuesToUse, JSON.stringify(preview));

    // Also cache in memory as fallback
    this.setCache(cacheKey, preview);

    this.logger.log(`Preview generated successfully for template: ${templateId}`);
    return preview;
  }

  /**
   * Generate preview from template data (without saving to database)
   * Useful for real-time preview during template creation
   */
  async generatePreviewFromData(
    templateData: {
      name: string;
      displayName?: string;
      category: string;
      language: string;
      components: any;
      sampleValues?: Record<string, string>;
    },
    sampleValues?: Record<string, string>,
  ): Promise<any> {
    this.logger.log(`Generating preview from template data: ${templateData.name}`);

    const valuesToUse = sampleValues || templateData.sampleValues || {};

    const preview = {
      header: this.renderHeaderFromComponents(templateData.components?.header, valuesToUse),
      body: this.renderBodyFromComponents(templateData.components?.body, valuesToUse),
      footer: this.renderFooterFromComponents(templateData.components?.footer),
      buttons: this.renderButtonsFromComponents(templateData.components?.buttons),
      metadata: {
        templateName: templateData.displayName || templateData.name,
        category: templateData.category,
        language: templateData.language,
        timestamp: new Date().toISOString(),
      },
    };

    return preview;
  }

  /**
   * Render header component with placeholder replacement
   * Requirement 6.6: Show media previews for HEADER media components
   */
  private renderHeader(
    template: Template,
    sampleValues: Record<string, string>,
  ): { type: string; content: string; mediaUrl?: string } | undefined {
    const header = template.components?.header;
    if (!header) return undefined;

    if (header.type === 'TEXT') {
      return {
        type: 'TEXT',
        content: this.replacePlaceholders(header.text || '', sampleValues),
      };
    }

    // Media types: IMAGE, VIDEO, DOCUMENT, LOCATION
    return {
      type: header.type,
      content: `[${header.type}]`,
      mediaUrl: header.mediaUrl,
    };
  }

  /**
   * Render header from components object
   */
  private renderHeaderFromComponents(
    header: any,
    sampleValues: Record<string, string>,
  ): { type: string; content: string; mediaUrl?: string } | undefined {
    if (!header) return undefined;

    if (header.type === 'TEXT') {
      return {
        type: 'TEXT',
        content: this.replacePlaceholders(header.text || '', sampleValues),
      };
    }

    return {
      type: header.type,
      content: `[${header.type}]`,
      mediaUrl: header.mediaUrl,
    };
  }

  /**
   * Render body component with placeholder replacement
   * Requirement 6.3: Replace placeholders with sample values
   */
  private renderBody(template: Template, sampleValues: Record<string, string>): string {
    const bodyText = template.components?.body?.text || template.content || '';
    return this.replacePlaceholders(bodyText, sampleValues);
  }

  /**
   * Render body from components object
   */
  private renderBodyFromComponents(body: any, sampleValues: Record<string, string>): string {
    if (!body || !body.text) return '';
    return this.replacePlaceholders(body.text, sampleValues);
  }

  /**
   * Render footer component (no placeholders allowed)
   */
  private renderFooter(template: Template): string | undefined {
    return template.components?.footer?.text || template.footer || undefined;
  }

  /**
   * Render footer from components object
   */
  private renderFooterFromComponents(footer: any): string | undefined {
    return footer?.text || undefined;
  }

  /**
   * Render buttons with proper formatting
   */
  private renderButtons(
    template: Template,
  ): Array<{ type: string; text: string; url?: string; phoneNumber?: string }> | undefined {
    const buttons = template.components?.buttons || template.buttons;
    if (!buttons || buttons.length === 0) return undefined;

    return buttons.map((button) => ({
      type: button.type,
      text: button.text,
      url: button.url,
      phoneNumber: button.phoneNumber,
    }));
  }

  /**
   * Render buttons from components object
   */
  private renderButtonsFromComponents(
    buttons: any[],
  ): Array<{ type: string; text: string; url?: string; phoneNumber?: string }> | undefined {
    if (!buttons || buttons.length === 0) return undefined;

    return buttons.map((button) => ({
      type: button.type,
      text: button.text,
      url: button.url,
      phoneNumber: button.phoneNumber,
    }));
  }

  /**
   * Replace placeholders with sample values
   * Supports {{1}}, {{2}}, etc. format
   * 
   * Requirement 6.3: Replace placeholders with sample values in preview
   */
  private replacePlaceholders(text: string, sampleValues: Record<string, string>): string {
    if (!text) return '';

    let result = text;

    // Replace {{1}}, {{2}}, etc. with sample values
    const placeholderRegex = /\{\{(\d+)\}\}/g;
    result = result.replace(placeholderRegex, (match, index) => {
      const value = sampleValues[index];
      if (value !== undefined && value !== null) {
        return value;
      }
      // If no sample value provided, keep the placeholder visible
      return match;
    });

    return result;
  }

  /**
   * Apply WhatsApp-style formatting to text
   * Supports: *bold*, _italic_, ~strikethrough~, ```code```
   */
  private applyWhatsAppFormatting(text: string): string {
    if (!text) return '';

    let formatted = text;

    // Note: In a real implementation, this would convert WhatsApp markdown
    // to HTML or another format for display. For now, we keep the original
    // formatting markers as they would appear in WhatsApp.

    return formatted;
  }

  /**
   * Generate a WhatsApp-style message bubble preview
   * This creates a complete visual representation
   */
  async generateWhatsAppBubblePreview(
    templateId: string,
    sampleValues?: Record<string, string>,
  ): Promise<{
    html: string;
    plainText: string;
  }> {
    const preview = await this.generatePreview(templateId, sampleValues);

    // Generate plain text version
    const plainTextParts: string[] = [];

    if (preview.header) {
      if (preview.header.type === 'TEXT') {
        plainTextParts.push(`**${preview.header.content}**`);
      } else {
        plainTextParts.push(`[${preview.header.type}]`);
      }
    }

    plainTextParts.push(preview.body);

    if (preview.footer) {
      plainTextParts.push(`_${preview.footer}_`);
    }

    if (preview.buttons && preview.buttons.length > 0) {
      plainTextParts.push('');
      preview.buttons.forEach((button) => {
        plainTextParts.push(`[${button.text}]`);
      });
    }

    const plainText = plainTextParts.join('\n\n');

    // Generate HTML version (simplified)
    const htmlParts: string[] = ['<div class="whatsapp-message-bubble">'];

    if (preview.header) {
      if (preview.header.type === 'TEXT') {
        htmlParts.push(`<div class="message-header"><strong>${this.escapeHtml(preview.header.content)}</strong></div>`);
      } else if (preview.header.mediaUrl) {
        htmlParts.push(`<div class="message-media"><img src="${this.escapeHtml(preview.header.mediaUrl)}" alt="${preview.header.type}" /></div>`);
      } else {
        htmlParts.push(`<div class="message-media-placeholder">[${preview.header.type}]</div>`);
      }
    }

    htmlParts.push(`<div class="message-body">${this.escapeHtml(preview.body).replace(/\n/g, '<br>')}</div>`);

    if (preview.footer) {
      htmlParts.push(`<div class="message-footer"><small>${this.escapeHtml(preview.footer)}</small></div>`);
    }

    if (preview.buttons && preview.buttons.length > 0) {
      htmlParts.push('<div class="message-buttons">');
      preview.buttons.forEach((button) => {
        htmlParts.push(`<button class="message-button message-button-${button.type.toLowerCase()}">${this.escapeHtml(button.text)}</button>`);
      });
      htmlParts.push('</div>');
    }

    htmlParts.push('</div>');

    return {
      html: htmlParts.join(''),
      plainText,
    };
  }

  /**
   * Invalidate cache for a specific template
   */
  invalidateCache(templateId: string): void {
    this.logger.log(`Invalidating preview cache for template: ${templateId}`);
    
    // Remove all cache entries for this template
    const keysToDelete: string[] = [];
    for (const key of this.previewCache.keys()) {
      if (key.startsWith(`${templateId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.previewCache.delete(key));
    this.logger.log(`Invalidated ${keysToDelete.length} cache entries for template: ${templateId}`);
  }

  /**
   * Clear all preview cache
   */
  clearCache(): void {
    this.logger.log('Clearing all preview cache');
    this.previewCache.clear();
  }

  /**
   * Get cache key for a template and sample values
   */
  private getCacheKey(templateId: string, sampleValues?: Record<string, string>): string {
    const valuesHash = sampleValues ? JSON.stringify(sampleValues) : 'default';
    return `${templateId}:${valuesHash}`;
  }

  /**
   * Get preview from cache if not expired
   */
  private getFromCache(cacheKey: string): any | null {
    const cached = this.previewCache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      // Cache expired
      this.previewCache.delete(cacheKey);
      return null;
    }

    return cached.preview;
  }

  /**
   * Set preview in cache
   */
  private setCache(cacheKey: string, preview: any): void {
    this.previewCache.set(cacheKey, {
      preview,
      timestamp: Date.now(),
    });

    // Clean up old cache entries periodically
    if (this.previewCache.size > 1000) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, value] of this.previewCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.previewCache.delete(key));
    this.logger.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    ttl: number;
  } {
    return {
      size: this.previewCache.size,
      maxSize: 1000,
      ttl: this.CACHE_TTL,
    };
  }
}

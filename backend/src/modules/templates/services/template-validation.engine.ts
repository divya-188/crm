import { Injectable, Inject, Optional } from '@nestjs/common';
import { TemplateCacheService } from './template-cache.service';

// Validation constants
export const VALIDATION_CONSTANTS = {
  BODY_MAX_LENGTH: 1024,
  HEADER_TEXT_MAX_LENGTH: 60,
  FOOTER_MAX_LENGTH: 60,
  BUTTON_TEXT_MAX_LENGTH: 25,
  MAX_QUICK_REPLY_BUTTONS: 3,
  MAX_CTA_BUTTONS: 2,
  TEMPLATE_NAME_MAX_LENGTH: 512,
} as const;

// Policy violation rules - configurable patterns
export interface PolicyRules {
  sensitiveDataPatterns: Array<{ pattern: RegExp; name: string }>;
  spamLanguagePatterns: Array<{ pattern: RegExp; name: string }>;
}

export const DEFAULT_POLICY_RULES: PolicyRules = {
  sensitiveDataPatterns: [
    { pattern: /credit\s*card/i, name: 'credit card' },
    { pattern: /\bcvv\b/i, name: 'CVV' },
    { pattern: /\bcvc\b/i, name: 'CVC' },
    { pattern: /social\s*security/i, name: 'social security number' },
    { pattern: /\bssn\b/i, name: 'SSN' },
    { pattern: /\bpassword\b/i, name: 'password' },
    { pattern: /\bpin\s*code\b/i, name: 'PIN code' },
    { pattern: /\bpin\b(?!\s*code)/i, name: 'PIN' },
    { pattern: /bank\s*account/i, name: 'bank account' },
    { pattern: /routing\s*number/i, name: 'routing number' },
    { pattern: /debit\s*card/i, name: 'debit card' },
  ],
  spamLanguagePatterns: [
    { pattern: /buy\s*now/i, name: 'buy now' },
    { pattern: /limited\s*time/i, name: 'limited time' },
    { pattern: /act\s*fast/i, name: 'act fast' },
    { pattern: /act\s*now/i, name: 'act now' },
    { pattern: /click\s*here/i, name: 'click here' },
    { pattern: /urgent/i, name: 'urgent' },
    { pattern: /hurry/i, name: 'hurry' },
    { pattern: /don't\s*miss/i, name: "don't miss" },
    { pattern: /once\s*in\s*a\s*lifetime/i, name: 'once in a lifetime' },
    { pattern: /exclusive\s*offer/i, name: 'exclusive offer' },
    { pattern: /free\s*money/i, name: 'free money' },
    { pattern: /guaranteed/i, name: 'guaranteed' },
    { pattern: /risk\s*free/i, name: 'risk free' },
    { pattern: /no\s*obligation/i, name: 'no obligation' },
  ],
};

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Validation warning interface
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

@Injectable()
export class TemplateValidationEngine {
  private policyRules: PolicyRules;

  constructor(
    @Optional() private cacheService: TemplateCacheService,
  ) {
    // Initialize with default policy rules
    this.policyRules = DEFAULT_POLICY_RULES;
  }

  /**
   * Set custom policy rules (for configuration)
   */
  setPolicyRules(rules: Partial<PolicyRules>): void {
    this.policyRules = {
      ...DEFAULT_POLICY_RULES,
      ...rules,
    };
  }

  /**
   * Get current policy rules
   */
  getPolicyRules(): PolicyRules {
    return this.policyRules;
  }

  /**
   * Main validation method that runs all validation checks
   * Task 58: Implements validation result caching
   */
  async validate(template: any): Promise<ValidationResult> {
    // Try to get from cache if cache service is available
    if (this.cacheService) {
      const cached = await this.cacheService.getValidationResult(template);
      if (cached) {
        return cached;
      }
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Validate template name
    errors.push(...this.validateTemplateName(template.name));

    // 2. Validate category
    errors.push(...this.validateCategory(template.category));

    // 3. Validate components structure
    if (template.components) {
      errors.push(...this.validateComponents(template.components));
      
      // 4. Validate buttons if present
      if (template.components.buttons) {
        errors.push(...this.validateButtons(template.components.buttons));
      }

      // 5. Validate sample values
      errors.push(...this.validateSampleValues(template.components, template.sampleValues));

      // 6. Check for policy violations
      errors.push(...this.checkPolicyViolations(template));
    }

    // 7. Generate warnings
    warnings.push(...this.generateWarnings(template));

    const result = {
      isValid: errors.length === 0,
      errors,
      warnings,
    };

    // Cache the result if cache service is available
    if (this.cacheService) {
      await this.cacheService.setValidationResult(template, result);
    }

    return result;
  }

  /**
   * Validate template name format
   */
  validateTemplateName(name: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!name) {
      errors.push({
        field: 'name',
        message: 'Template name is required',
        code: 'NAME_REQUIRED',
      });
      return errors;
    }

    // Must be lowercase with underscores only
    if (!/^[a-z0-9_]+$/.test(name)) {
      errors.push({
        field: 'name',
        message:
          'Template name must be lowercase with underscores only (no spaces or special characters)',
        code: 'INVALID_NAME_FORMAT',
      });
    }

    // Length check
    if (name.length > VALIDATION_CONSTANTS.TEMPLATE_NAME_MAX_LENGTH) {
      errors.push({
        field: 'name',
        message: `Template name must not exceed ${VALIDATION_CONSTANTS.TEMPLATE_NAME_MAX_LENGTH} characters`,
        code: 'NAME_TOO_LONG',
      });
    }

    return errors;
  }

  /**
   * Validate template category
   */
  validateCategory(category: string): ValidationError[] {
    const errors: ValidationError[] = [];

    const validCategories = [
      'TRANSACTIONAL',
      'UTILITY',
      'MARKETING',
      'ACCOUNT_UPDATE',
      'OTP',
      // Legacy support
      'marketing',
      'utility',
      'authentication',
    ];

    if (!category) {
      errors.push({
        field: 'category',
        message: 'Template category is required',
        code: 'CATEGORY_REQUIRED',
      });
    } else if (!validCategories.includes(category)) {
      errors.push({
        field: 'category',
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        code: 'INVALID_CATEGORY',
      });
    }

    return errors;
  }

  /**
   * Validate template components (header, body, footer, buttons)
   */
  validateComponents(components: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Body is required
    if (!components.body || !components.body.text) {
      errors.push({
        field: 'components.body',
        message: 'Body text is required',
        code: 'BODY_REQUIRED',
      });
      return errors;
    }

    // Validate body length
    if (components.body.text.length > VALIDATION_CONSTANTS.BODY_MAX_LENGTH) {
      errors.push({
        field: 'components.body.text',
        message: `Body text must not exceed ${VALIDATION_CONSTANTS.BODY_MAX_LENGTH} characters`,
        code: 'BODY_TOO_LONG',
      });
    }

    // Validate placeholders in body
    errors.push(...this.validatePlaceholders(components));

    // Validate header if present
    if (components.header) {
      if (components.header.type === 'TEXT' && components.header.text) {
        if (
          components.header.text.length >
          VALIDATION_CONSTANTS.HEADER_TEXT_MAX_LENGTH
        ) {
          errors.push({
            field: 'components.header.text',
            message: `Header text must not exceed ${VALIDATION_CONSTANTS.HEADER_TEXT_MAX_LENGTH} characters`,
            code: 'HEADER_TEXT_TOO_LONG',
          });
        }
      }
    }

    // Validate footer if present
    if (components.footer && components.footer.text) {
      if (
        components.footer.text.length > VALIDATION_CONSTANTS.FOOTER_MAX_LENGTH
      ) {
        errors.push({
          field: 'components.footer.text',
          message: `Footer text must not exceed ${VALIDATION_CONSTANTS.FOOTER_MAX_LENGTH} characters`,
          code: 'FOOTER_TOO_LONG',
        });
      }

      // Footer should not contain placeholders
      if (/\{\{\d+\}\}/.test(components.footer.text)) {
        errors.push({
          field: 'components.footer.text',
          message: 'Footer text cannot contain placeholders',
          code: 'FOOTER_HAS_PLACEHOLDERS',
        });
      }
    }

    return errors;
  }

  /**
   * Validate placeholders in template components
   */
  validatePlaceholders(components: any): ValidationError[] {
    const errors: ValidationError[] = [];
    const bodyText = components.body?.text || '';

    // Extract all valid placeholders {{1}}, {{2}}, etc.
    const placeholderRegex = /\{\{(\d+)\}\}/g;
    const matches = [...bodyText.matchAll(placeholderRegex)];
    const placeholderNumbers = matches.map((m) => parseInt(m[1], 10));

    // Check for sequential numbering (must start from 1 and have no gaps)
    if (placeholderNumbers.length > 0) {
      const uniqueNumbers = [...new Set(placeholderNumbers)].sort((a, b) => a - b);
      
      for (let i = 0; i < uniqueNumbers.length; i++) {
        if (uniqueNumbers[i] !== i + 1) {
          errors.push({
            field: 'components.body.text',
            message: `Placeholders must be sequential starting from {{1}}. Found gap or wrong start at {{${i + 1}}}`,
            code: 'NON_SEQUENTIAL_PLACEHOLDERS',
          });
          break;
        }
      }
    }

    // Check for invalid placeholder formats
    // Pattern 1: {1} format (single braces) - must not be preceded or followed by another brace
    if (/(?<!\{)\{\d+\}(?!\})/.test(bodyText)) {
      errors.push({
        field: 'components.body.text',
        message: 'Invalid placeholder format. Use {{1}}, {{2}}, etc. (double braces)',
        code: 'INVALID_PLACEHOLDER_FORMAT',
      });
    }

    // Pattern 2: {{}} empty placeholders
    if (/\{\{\s*\}\}/.test(bodyText)) {
      errors.push({
        field: 'components.body.text',
        message: 'Empty placeholders {{}} are not allowed',
        code: 'EMPTY_PLACEHOLDER',
      });
    }

    // Pattern 3: {{name}} named placeholders
    if (/\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/.test(bodyText)) {
      errors.push({
        field: 'components.body.text',
        message: 'Named placeholders like {{name}} are not allowed. Use {{1}}, {{2}}, etc.',
        code: 'NAMED_PLACEHOLDER',
      });
    }

    // Pattern 4: %s format
    if (/%s/.test(bodyText)) {
      errors.push({
        field: 'components.body.text',
        message: 'Format specifiers like %s are not allowed. Use {{1}}, {{2}}, etc.',
        code: 'FORMAT_SPECIFIER',
      });
    }

    // Check for stacked placeholders without separators
    if (/\{\{\d+\}\}\{\{\d+\}\}/.test(bodyText)) {
      errors.push({
        field: 'components.body.text',
        message: 'Placeholders cannot be stacked without separators (e.g., {{1}}{{2}}). Add space or text between them',
        code: 'STACKED_PLACEHOLDERS',
      });
    }

    // Check for leading placeholders
    if (/^\{\{\d+\}\}/.test(bodyText.trim())) {
      errors.push({
        field: 'components.body.text',
        message: 'Placeholders should not be at the start of the body text',
        code: 'LEADING_PLACEHOLDER',
      });
    }

    // Check for trailing placeholders
    if (/\{\{\d+\}\}$/.test(bodyText.trim())) {
      errors.push({
        field: 'components.body.text',
        message: 'Placeholders should not be at the end of the body text',
        code: 'TRAILING_PLACEHOLDER',
      });
    }

    return errors;
  }

  /**
   * Extract placeholder numbers from text
   */
  extractPlaceholders(text: string): number[] {
    const placeholderRegex = /\{\{(\d+)\}\}/g;
    const matches = [...text.matchAll(placeholderRegex)];
    return matches.map((m) => parseInt(m[1], 10));
  }

  /**
   * Validate sample values for all placeholders
   * Requirements: 2.4, 6.1, 6.4, 10.4
   */
  validateSampleValues(components: any, sampleValues: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Extract all placeholders from body text
    const bodyText = components.body?.text || '';
    const placeholders = this.extractPlaceholders(bodyText);
    const uniquePlaceholders = [...new Set(placeholders)].sort((a, b) => a - b);

    // Check if sampleValues is provided
    if (!sampleValues || typeof sampleValues !== 'object') {
      if (uniquePlaceholders.length > 0) {
        errors.push({
          field: 'sampleValues',
          message: 'Sample values are required for all placeholders',
          code: 'SAMPLE_VALUES_REQUIRED',
        });
      }
      return errors;
    }

    // Check that all placeholders have corresponding sample values
    uniquePlaceholders.forEach((placeholderNum) => {
      const key = placeholderNum.toString();
      
      if (!(key in sampleValues)) {
        errors.push({
          field: `sampleValues.${key}`,
          message: `Sample value is required for placeholder {{${placeholderNum}}}`,
          code: 'MISSING_SAMPLE_VALUE',
        });
      } else {
        const sampleValue = sampleValues[key];

        // Check if sample value is empty
        if (!sampleValue || (typeof sampleValue === 'string' && sampleValue.trim() === '')) {
          errors.push({
            field: `sampleValues.${key}`,
            message: `Sample value for placeholder {{${placeholderNum}}} cannot be empty`,
            code: 'EMPTY_SAMPLE_VALUE',
          });
        } else if (typeof sampleValue === 'string') {
          // Validate sample value format
          errors.push(...this.validateSampleValueFormat(key, sampleValue));
          
          // Validate sample value length
          errors.push(...this.validateSampleValueLength(key, sampleValue));
        }
      }
    });

    // Check for extra sample values that don't have corresponding placeholders
    Object.keys(sampleValues).forEach((key) => {
      const placeholderNum = parseInt(key, 10);
      if (!isNaN(placeholderNum) && !uniquePlaceholders.includes(placeholderNum)) {
        errors.push({
          field: `sampleValues.${key}`,
          message: `Sample value provided for non-existent placeholder {{${placeholderNum}}}`,
          code: 'EXTRA_SAMPLE_VALUE',
        });
      }
    });

    // Also check header placeholders if header is TEXT type
    if (components.header?.type === 'TEXT' && components.header?.text) {
      const headerPlaceholders = this.extractPlaceholders(components.header.text);
      const uniqueHeaderPlaceholders = [...new Set(headerPlaceholders)];

      uniqueHeaderPlaceholders.forEach((placeholderNum) => {
        const key = `header_${placeholderNum}`;
        
        if (!(key in sampleValues)) {
          errors.push({
            field: `sampleValues.${key}`,
            message: `Sample value is required for header placeholder {{${placeholderNum}}}`,
            code: 'MISSING_HEADER_SAMPLE_VALUE',
          });
        } else {
          const sampleValue = sampleValues[key];

          if (!sampleValue || (typeof sampleValue === 'string' && sampleValue.trim() === '')) {
            errors.push({
              field: `sampleValues.${key}`,
              message: `Sample value for header placeholder {{${placeholderNum}}} cannot be empty`,
              code: 'EMPTY_HEADER_SAMPLE_VALUE',
            });
          } else if (typeof sampleValue === 'string') {
            errors.push(...this.validateSampleValueFormat(key, sampleValue));
            errors.push(...this.validateSampleValueLength(key, sampleValue));
          }
        }
      });
    }

    return errors;
  }

  /**
   * Validate sample value format (no special chars that break URLs)
   * Requirement: 6.4
   */
  private validateSampleValueFormat(key: string, value: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for special characters that could break URLs
    // These characters need to be URL-encoded if used in URLs
    const problematicChars = /[<>{}|\\^`\[\]]/;
    
    if (problematicChars.test(value)) {
      errors.push({
        field: `sampleValues.${key}`,
        message: 'Sample value contains special characters that may break URLs (<>{}|\\^`[])',
        code: 'INVALID_SAMPLE_VALUE_FORMAT',
      });
    }

    // Check for control characters (ASCII 0-31)
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1F]/.test(value)) {
      errors.push({
        field: `sampleValues.${key}`,
        message: 'Sample value contains control characters which are not allowed',
        code: 'CONTROL_CHARACTERS_IN_SAMPLE',
      });
    }

    return errors;
  }

  /**
   * Validate sample value length
   * Requirement: 10.4
   */
  private validateSampleValueLength(key: string, value: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Maximum length for sample values (reasonable limit)
    const MAX_SAMPLE_VALUE_LENGTH = 200;

    if (value.length > MAX_SAMPLE_VALUE_LENGTH) {
      errors.push({
        field: `sampleValues.${key}`,
        message: `Sample value exceeds maximum length of ${MAX_SAMPLE_VALUE_LENGTH} characters`,
        code: 'SAMPLE_VALUE_TOO_LONG',
      });
    }

    // Minimum length check (at least 1 non-whitespace character)
    if (value.trim().length === 0) {
      errors.push({
        field: `sampleValues.${key}`,
        message: 'Sample value must contain at least one non-whitespace character',
        code: 'SAMPLE_VALUE_ONLY_WHITESPACE',
      });
    }

    return errors;
  }

  /**
   * Validate buttons configuration
   */
  validateButtons(buttons: any[]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!buttons || buttons.length === 0) {
      return errors;
    }

    // Count button types
    const quickReplyButtons = buttons.filter((b) => b.type === 'QUICK_REPLY');
    const ctaButtons = buttons.filter((b) => b.type !== 'QUICK_REPLY');

    // Check for mixing button types
    if (quickReplyButtons.length > 0 && ctaButtons.length > 0) {
      errors.push({
        field: 'components.buttons',
        message: 'Cannot mix Quick Reply buttons with Call-To-Action buttons',
        code: 'MIXED_BUTTON_TYPES',
      });
    }

    // Check button count limits
    if (quickReplyButtons.length > VALIDATION_CONSTANTS.MAX_QUICK_REPLY_BUTTONS) {
      errors.push({
        field: 'components.buttons',
        message: `Maximum ${VALIDATION_CONSTANTS.MAX_QUICK_REPLY_BUTTONS} Quick Reply buttons allowed`,
        code: 'TOO_MANY_QUICK_REPLY_BUTTONS',
      });
    }

    if (ctaButtons.length > VALIDATION_CONSTANTS.MAX_CTA_BUTTONS) {
      errors.push({
        field: 'components.buttons',
        message: `Maximum ${VALIDATION_CONSTANTS.MAX_CTA_BUTTONS} Call-To-Action buttons allowed`,
        code: 'TOO_MANY_CTA_BUTTONS',
      });
    }

    // Validate individual buttons
    buttons.forEach((button, index) => {
      // Validate button text length
      if (!button.text) {
        errors.push({
          field: `components.buttons[${index}].text`,
          message: 'Button text is required',
          code: 'BUTTON_TEXT_REQUIRED',
        });
      } else if (button.text.length > VALIDATION_CONSTANTS.BUTTON_TEXT_MAX_LENGTH) {
        errors.push({
          field: `components.buttons[${index}].text`,
          message: `Button text must not exceed ${VALIDATION_CONSTANTS.BUTTON_TEXT_MAX_LENGTH} characters`,
          code: 'BUTTON_TEXT_TOO_LONG',
        });
      }

      // Validate URL buttons
      if (button.type === 'URL') {
        if (!button.url) {
          errors.push({
            field: `components.buttons[${index}].url`,
            message: 'URL is required for URL buttons',
            code: 'BUTTON_URL_REQUIRED',
          });
        } else {
          // Basic URL validation
          try {
            new URL(button.url);
          } catch (e) {
            errors.push({
              field: `components.buttons[${index}].url`,
              message: 'Invalid URL format',
              code: 'INVALID_BUTTON_URL',
            });
          }
        }
      }

      // Validate phone number buttons
      if (button.type === 'PHONE_NUMBER') {
        if (!button.phoneNumber) {
          errors.push({
            field: `components.buttons[${index}].phoneNumber`,
            message: 'Phone number is required for phone buttons',
            code: 'BUTTON_PHONE_REQUIRED',
          });
        } else {
          // E.164 format validation: +[country code][number]
          if (!/^\+[1-9]\d{1,14}$/.test(button.phoneNumber)) {
            errors.push({
              field: `components.buttons[${index}].phoneNumber`,
              message: 'Phone number must be in E.164 format (e.g., +1234567890)',
              code: 'INVALID_PHONE_FORMAT',
            });
          }
        }
      }
    });

    // Check for duplicate button text
    const buttonTexts = buttons.map((b) => b.text?.toLowerCase()).filter(Boolean);
    const duplicates = buttonTexts.filter(
      (text, index) => buttonTexts.indexOf(text) !== index,
    );
    
    if (duplicates.length > 0) {
      errors.push({
        field: 'components.buttons',
        message: 'Button text must be unique within the template',
        code: 'DUPLICATE_BUTTON_TEXT',
      });
    }

    return errors;
  }

  /**
   * Check for policy violations in template content
   * Requirements: 10.4, 18.4
   * 
   * This method checks for:
   * 1. Sensitive data requests (credit card, CVV, SSN, password, PIN)
   * 2. Spam language (buy now, limited time, act fast, etc.)
   */
  checkPolicyViolations(template: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Collect all text content from the template
    const textContent: Array<{ field: string; text: string }> = [];

    // Add body text
    if (template.components?.body?.text) {
      textContent.push({
        field: 'components.body.text',
        text: template.components.body.text,
      });
    }

    // Add header text if present
    if (template.components?.header?.type === 'TEXT' && template.components.header.text) {
      textContent.push({
        field: 'components.header.text',
        text: template.components.header.text,
      });
    }

    // Add footer text if present
    if (template.components?.footer?.text) {
      textContent.push({
        field: 'components.footer.text',
        text: template.components.footer.text,
      });
    }

    // Add button text if present
    if (template.components?.buttons && Array.isArray(template.components.buttons)) {
      template.components.buttons.forEach((button: any, index: number) => {
        if (button.text) {
          textContent.push({
            field: `components.buttons[${index}].text`,
            text: button.text,
          });
        }
      });
    }

    // Check each text field for policy violations
    textContent.forEach(({ field, text }) => {
      // Check for sensitive data requests
      const sensitiveDataViolations = this.detectSensitiveData(text);
      sensitiveDataViolations.forEach((violation) => {
        errors.push({
          field,
          message: `Template requests sensitive information (${violation}), which violates Meta's WhatsApp policies. Remove requests for credit card numbers, CVV, SSN, passwords, PINs, or other sensitive data.`,
          code: 'POLICY_VIOLATION_SENSITIVE_DATA',
        });
      });

      // Check for spam language
      const spamViolations = this.detectSpamLanguage(text);
      spamViolations.forEach((violation) => {
        errors.push({
          field,
          message: `Template contains spam language ("${violation}") that may lead to rejection. Avoid urgency tactics, pressure language, and clickbait phrases.`,
          code: 'POLICY_VIOLATION_SPAM_LANGUAGE',
        });
      });
    });

    return errors;
  }

  /**
   * Detect sensitive data requests in text
   * Returns array of detected sensitive data types
   */
  private detectSensitiveData(text: string): string[] {
    const violations: string[] = [];
    const lowerText = text.toLowerCase();

    this.policyRules.sensitiveDataPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(lowerText)) {
        violations.push(name);
      }
    });

    return violations;
  }

  /**
   * Detect spam language in text
   * Returns array of detected spam phrases
   */
  private detectSpamLanguage(text: string): string[] {
    const violations: string[] = [];
    const lowerText = text.toLowerCase();

    this.policyRules.spamLanguagePatterns.forEach(({ pattern, name }) => {
      if (pattern.test(lowerText)) {
        violations.push(name);
      }
    });

    return violations;
  }

  /**
   * Generate warnings for best practices
   */
  private generateWarnings(template: any): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Warn if no description
    if (!template.description) {
      warnings.push({
        field: 'description',
        message: 'Adding a description helps organize your templates',
        code: 'MISSING_DESCRIPTION',
      });
    }

    // Warn if body is very short
    if (template.components?.body?.text && template.components.body.text.length < 20) {
      warnings.push({
        field: 'components.body.text',
        message: 'Body text is very short. Consider adding more context',
        code: 'BODY_TOO_SHORT',
      });
    }

    // Warn if body is very long
    if (template.components?.body?.text && template.components.body.text.length > 800) {
      warnings.push({
        field: 'components.body.text',
        message: 'Body text is quite long. Consider making it more concise',
        code: 'BODY_VERY_LONG',
      });
    }

    return warnings;
  }

  /**
   * Calculate quality score for a template (0-100)
   * Requirement: 18.6
   * 
   * This method evaluates template quality based on:
   * - Body text length (optimal range)
   * - Component completeness (footer, description)
   * - Placeholder usage (penalty for excessive placeholders)
   * - Spam indicator detection
   * 
   * @param template - The template to score
   * @returns Quality score breakdown with overall score and detailed scoring
   */
  calculateQualityScore(template: any): QualityScoreBreakdown {
    let score = 100;
    const breakdown: QualityScoreDetail[] = [];

    // 1. Score body text length (optimal range: 50-500 characters)
    const bodyLength = template.components?.body?.text?.length || 0;
    const bodyLengthScore = this.scoreBodyLength(bodyLength);
    score += bodyLengthScore.points;
    breakdown.push(bodyLengthScore);

    // 2. Score component completeness
    const completenessScore = this.scoreComponentCompleteness(template);
    score += completenessScore.points;
    breakdown.push(completenessScore);

    // 3. Penalty for excessive placeholders (> 5)
    const placeholderScore = this.scorePlaceholderUsage(template);
    score += placeholderScore.points;
    breakdown.push(placeholderScore);

    // 4. Spam indicator detection and scoring
    const spamScore = this.scoreSpamIndicators(template);
    score += spamScore.points;
    breakdown.push(spamScore);

    // Ensure score is within 0-100 range
    const finalScore = Math.max(0, Math.min(100, score));

    return {
      score: finalScore,
      breakdown,
      rating: this.getQualityRating(finalScore),
    };
  }

  /**
   * Score body text length
   * Optimal range: 50-500 characters
   * - Too short (< 50): -10 points
   * - Too long (> 800): -10 points
   * - Very long (> 1000): -15 points
   * - Optimal (50-500): +5 points
   */
  private scoreBodyLength(length: number): QualityScoreDetail {
    let points = 0;
    let message = '';
    let suggestion = '';

    if (length < 50) {
      points = -10;
      message = 'Body text is too short';
      suggestion = 'Add more context to make your message clearer (aim for 50-500 characters)';
    } else if (length > 1000) {
      points = -15;
      message = 'Body text is excessively long';
      suggestion = 'Significantly reduce text length for better readability (aim for 50-500 characters)';
    } else if (length > 800) {
      points = -10;
      message = 'Body text is quite long';
      suggestion = 'Consider making your message more concise (aim for 50-500 characters)';
    } else if (length >= 50 && length <= 500) {
      points = 5;
      message = 'Body text length is optimal';
      suggestion = '';
    } else {
      // 500-800 range: neutral, no points added or deducted
      message = 'Body text length is acceptable';
      suggestion = '';
    }

    return {
      category: 'Body Length',
      points,
      message,
      suggestion,
    };
  }

  /**
   * Score component completeness
   * - Has footer: +5 points
   * - Has description: +5 points
   * - Has header: +3 points
   */
  private scoreComponentCompleteness(template: any): QualityScoreDetail {
    let points = 0;
    const features: string[] = [];
    const missing: string[] = [];

    // Check for footer
    if (template.components?.footer?.text) {
      points += 5;
      features.push('footer');
    } else {
      missing.push('footer');
    }

    // Check for description
    if (template.description && template.description.trim().length > 0) {
      points += 5;
      features.push('description');
    } else {
      missing.push('description');
    }

    // Check for header
    if (template.components?.header) {
      points += 3;
      features.push('header');
    } else {
      missing.push('header');
    }

    let message = '';
    let suggestion = '';

    if (points === 13) {
      message = 'Template has all recommended components';
      suggestion = '';
    } else if (points >= 8) {
      message = `Template has most recommended components (${features.join(', ')})`;
      suggestion = missing.length > 0 
        ? `Consider adding: ${missing.join(', ')} for better completeness`
        : '';
    } else {
      message = 'Template is missing several recommended components';
      suggestion = `Add ${missing.join(', ')} to improve template quality and user experience`;
    }

    return {
      category: 'Component Completeness',
      points,
      message,
      suggestion,
    };
  }

  /**
   * Score placeholder usage
   * - Excessive placeholders (> 5): -10 points
   * - Many placeholders (4-5): -5 points
   * - Optimal (1-3): 0 points
   */
  private scorePlaceholderUsage(template: any): QualityScoreDetail {
    const bodyText = template.components?.body?.text || '';
    const placeholders = this.extractPlaceholders(bodyText);
    const uniquePlaceholders = [...new Set(placeholders)];
    const count = uniquePlaceholders.length;

    let points = 0;
    let message = '';
    let suggestion = '';

    if (count > 5) {
      points = -10;
      message = `Template has excessive placeholders (${count})`;
      suggestion = 'Reduce the number of placeholders to 5 or fewer. Too many variables make templates harder to manage and may confuse recipients';
    } else if (count >= 4) {
      points = -5;
      message = `Template has many placeholders (${count})`;
      suggestion = 'Consider reducing placeholders to 3 or fewer for better readability';
    } else if (count > 0) {
      message = `Template has ${count} placeholder${count > 1 ? 's' : ''} (optimal range)`;
      suggestion = '';
    } else {
      message = 'Template has no placeholders';
      suggestion = '';
    }

    return {
      category: 'Placeholder Usage',
      points,
      message,
      suggestion,
    };
  }

  /**
   * Score spam indicators
   * - Has spam language: -15 points per indicator (max -30)
   * - Has sensitive data requests: -20 points per indicator (max -40)
   */
  private scoreSpamIndicators(template: any): QualityScoreDetail {
    let points = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Collect all text content
    const allText: string[] = [];
    
    if (template.components?.body?.text) {
      allText.push(template.components.body.text);
    }
    if (template.components?.header?.type === 'TEXT' && template.components.header.text) {
      allText.push(template.components.header.text);
    }
    if (template.components?.footer?.text) {
      allText.push(template.components.footer.text);
    }

    const combinedText = allText.join(' ');

    // Check for spam language
    const spamViolations = this.detectSpamLanguage(combinedText);
    if (spamViolations.length > 0) {
      const deduction = Math.min(spamViolations.length * 15, 30);
      points -= deduction;
      issues.push(`spam language detected (${spamViolations.slice(0, 3).join(', ')}${spamViolations.length > 3 ? '...' : ''})`);
      suggestions.push('Remove urgency tactics and pressure language like "buy now", "limited time", "act fast"');
    }

    // Check for sensitive data requests
    const sensitiveViolations = this.detectSensitiveData(combinedText);
    if (sensitiveViolations.length > 0) {
      const deduction = Math.min(sensitiveViolations.length * 20, 40);
      points -= deduction;
      issues.push(`sensitive data requests (${sensitiveViolations.join(', ')})`);
      suggestions.push('Never request sensitive information like credit cards, passwords, or SSN in templates');
    }

    let message = '';
    let suggestion = '';

    if (issues.length === 0) {
      message = 'No spam indicators or policy violations detected';
      suggestion = '';
    } else {
      message = `Quality issues found: ${issues.join('; ')}`;
      suggestion = suggestions.join('. ');
    }

    return {
      category: 'Policy Compliance',
      points,
      message,
      suggestion,
    };
  }

  /**
   * Get quality rating based on score
   */
  private getQualityRating(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Very Poor';
  }
}

/**
 * Quality score breakdown interface
 */
export interface QualityScoreBreakdown {
  score: number; // Overall score (0-100)
  breakdown: QualityScoreDetail[]; // Detailed scoring by category
  rating: string; // Quality rating (Excellent, Good, Fair, Poor, Very Poor)
}

/**
 * Quality score detail for a specific category
 */
export interface QualityScoreDetail {
  category: string; // Category name (e.g., "Body Length", "Component Completeness")
  points: number; // Points added or deducted
  message: string; // Description of the scoring
  suggestion: string; // Suggestion for improvement (empty if no improvement needed)
}

import { Test, TestingModule } from '@nestjs/testing';
import { TemplateValidationEngine } from '../template-validation.engine';

describe('TemplateValidationEngine - Name and Category Validation', () => {
  let engine: TemplateValidationEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateValidationEngine],
    }).compile();

    engine = module.get<TemplateValidationEngine>(TemplateValidationEngine);
  });

  describe('validateTemplateName', () => {
    it('should accept valid lowercase names with underscores', () => {
      const validNames = [
        'order_confirmation',
        'welcome_message',
        'password_reset_v2',
        'account_update_2024',
      ];

      validNames.forEach(name => {
        const errors = engine.validateTemplateName(name);
        expect(errors).toHaveLength(0);
      });
    });

    it('should reject names with uppercase letters', () => {
      const errors = engine.validateTemplateName('OrderConfirmation');
      expect(errors.some(e => e.code === 'INVALID_NAME_FORMAT')).toBe(true);
    });

    it('should reject names with spaces', () => {
      const errors = engine.validateTemplateName('order confirmation');
      expect(errors.some(e => e.code === 'INVALID_NAME_FORMAT')).toBe(true);
    });

    it('should reject names with hyphens', () => {
      const errors = engine.validateTemplateName('order-confirmation');
      expect(errors.some(e => e.code === 'INVALID_NAME_FORMAT')).toBe(true);
    });

    it('should reject names with special characters', () => {
      const invalidNames = [
        'order@confirmation',
        'order#confirmation',
        'order$confirmation',
        'order%confirmation',
        'order&confirmation',
        'order*confirmation',
      ];

      invalidNames.forEach(name => {
        const errors = engine.validateTemplateName(name);
        expect(errors.some(e => e.code === 'INVALID_NAME_FORMAT')).toBe(true);
      });
    });

    it('should reject empty names', () => {
      const errors = engine.validateTemplateName('');
      expect(errors.some(e => e.code === 'NAME_REQUIRED')).toBe(true);
    });

    it('should reject null names', () => {
      const errors = engine.validateTemplateName(null);
      expect(errors.some(e => e.code === 'NAME_REQUIRED')).toBe(true);
    });

    it('should reject undefined names', () => {
      const errors = engine.validateTemplateName(undefined);
      expect(errors.some(e => e.code === 'NAME_REQUIRED')).toBe(true);
    });

    it('should reject names exceeding 512 characters', () => {
      const longName = 'a'.repeat(513);
      const errors = engine.validateTemplateName(longName);
      expect(errors.some(e => e.code === 'NAME_TOO_LONG')).toBe(true);
    });

    it('should accept names up to 512 characters', () => {
      const longName = 'a'.repeat(512);
      const errors = engine.validateTemplateName(longName);
      const lengthError = errors.find(e => e.code === 'NAME_TOO_LONG');
      expect(lengthError).toBeUndefined();
    });

    it('should accept names with numbers', () => {
      const errors = engine.validateTemplateName('order_confirmation_123');
      expect(errors).toHaveLength(0);
    });

    it('should accept names starting with numbers', () => {
      const errors = engine.validateTemplateName('2024_order_confirmation');
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateCategory', () => {
    it('should accept valid categories', () => {
      const validCategories = [
        'TRANSACTIONAL',
        'UTILITY',
        'MARKETING',
        'ACCOUNT_UPDATE',
        'OTP',
      ];

      validCategories.forEach(category => {
        const errors = engine.validateCategory(category);
        expect(errors).toHaveLength(0);
      });
    });

    it('should accept legacy lowercase categories', () => {
      const legacyCategories = [
        'marketing',
        'utility',
        'authentication',
      ];

      legacyCategories.forEach(category => {
        const errors = engine.validateCategory(category);
        expect(errors).toHaveLength(0);
      });
    });

    it('should reject invalid categories', () => {
      const invalidCategories = [
        'PROMOTIONAL',
        'NOTIFICATION',
        'ALERT',
        'CUSTOM',
      ];

      invalidCategories.forEach(category => {
        const errors = engine.validateCategory(category);
        expect(errors.some(e => e.code === 'INVALID_CATEGORY')).toBe(true);
      });
    });

    it('should reject empty category', () => {
      const errors = engine.validateCategory('');
      expect(errors.some(e => e.code === 'CATEGORY_REQUIRED')).toBe(true);
    });

    it('should reject null category', () => {
      const errors = engine.validateCategory(null);
      expect(errors.some(e => e.code === 'CATEGORY_REQUIRED')).toBe(true);
    });

    it('should reject undefined category', () => {
      const errors = engine.validateCategory(undefined);
      expect(errors.some(e => e.code === 'CATEGORY_REQUIRED')).toBe(true);
    });

    it('should be case-sensitive for non-legacy categories', () => {
      const errors = engine.validateCategory('transactional');
      expect(errors.some(e => e.code === 'INVALID_CATEGORY')).toBe(true);
    });
  });

  describe('Full template validation', () => {
    it('should validate complete template successfully', async () => {
      const template = {
        name: 'order_confirmation',
        category: 'TRANSACTIONAL',
        description: 'Order confirmation template',
        components: {
          header: {
            type: 'TEXT',
            text: 'Order Confirmed',
          },
          body: {
            text: 'Hello {{1}}, your order {{2}} has been confirmed.',
          },
          footer: {
            text: 'Reply STOP to unsubscribe',
          },
        },
        sampleValues: {
          '1': 'John',
          '2': 'ORD-12345',
        },
      };

      const result = await engine.validate(template);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all validation errors', async () => {
      const template = {
        name: 'Invalid Name!',
        category: 'INVALID_CATEGORY',
        components: {
          body: {
            text: '{{1}}{{2}} with {{name}} and %s',
          },
          footer: {
            text: 'Footer with {{1}} placeholder',
          },
          buttons: [
            { type: 'QUICK_REPLY', text: 'Yes' },
            { type: 'URL', text: 'Visit', url: 'https://example.com' },
          ],
        },
      };

      const result = await engine.validate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
      expect(result.errors.some(e => e.code === 'INVALID_NAME_FORMAT')).toBe(true);
      expect(result.errors.some(e => e.code === 'INVALID_CATEGORY')).toBe(true);
      expect(result.errors.some(e => e.code === 'FOOTER_HAS_PLACEHOLDERS')).toBe(true);
      expect(result.errors.some(e => e.code === 'MIXED_BUTTON_TYPES')).toBe(true);
    });

    it('should generate warnings for best practices', async () => {
      const template = {
        name: 'test',
        category: 'TRANSACTIONAL',
        components: {
          body: {
            text: 'Short',
          },
        },
      };

      const result = await engine.validate(template);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

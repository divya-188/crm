import { Test, TestingModule } from '@nestjs/testing';
import { TemplateValidationEngine } from '../template-validation.engine';

describe('TemplateValidationEngine - Placeholder Validation', () => {
  let engine: TemplateValidationEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateValidationEngine],
    }).compile();

    engine = module.get<TemplateValidationEngine>(TemplateValidationEngine);
  });

  describe('validatePlaceholders', () => {
    it('should accept valid sequential placeholders', () => {
      const components = {
        body: {
          text: 'Hello {{1}}, your order {{2}} is ready',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors).toHaveLength(0);
    });

    it('should reject non-sequential placeholders', () => {
      const components = {
        body: {
          text: 'Hello {{1}}, your order {{3}} is ready',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('NON_SEQUENTIAL_PLACEHOLDERS');
      expect(errors[0].field).toBe('components.body.text');
    });

    it('should reject placeholders not starting from 1', () => {
      const components = {
        body: {
          text: 'Hello {{2}}, your order {{3}} is ready',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('NON_SEQUENTIAL_PLACEHOLDERS');
    });

    it('should reject single brace format {1}', () => {
      const components = {
        body: {
          text: 'Hello {1}, your order is ready',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'INVALID_PLACEHOLDER_FORMAT')).toBe(true);
    });

    it('should reject empty placeholders {{}}', () => {
      const components = {
        body: {
          text: 'Hello {{}}, your order is ready',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'EMPTY_PLACEHOLDER')).toBe(true);
    });

    it('should reject named placeholders {{name}}', () => {
      const components = {
        body: {
          text: 'Hello {{name}}, your order is ready',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'NAMED_PLACEHOLDER')).toBe(true);
    });

    it('should reject format specifiers %s', () => {
      const components = {
        body: {
          text: 'Hello %s, your order is ready',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'FORMAT_SPECIFIER')).toBe(true);
    });

    it('should reject stacked placeholders without separators', () => {
      const components = {
        body: {
          text: 'Hello {{1}}{{2}}, your order is ready',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'STACKED_PLACEHOLDERS')).toBe(true);
    });

    it('should accept placeholders with separators', () => {
      const components = {
        body: {
          text: 'Hello {{1}} {{2}}, your order is ready',
        },
      };

      const errors = engine.validatePlaceholders(components);
      const stackedError = errors.find(e => e.code === 'STACKED_PLACEHOLDERS');
      expect(stackedError).toBeUndefined();
    });

    it('should reject leading placeholders', () => {
      const components = {
        body: {
          text: '{{1}} is your order number',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'LEADING_PLACEHOLDER')).toBe(true);
    });

    it('should reject trailing placeholders', () => {
      const components = {
        body: {
          text: 'Your order number is {{1}}',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'TRAILING_PLACEHOLDER')).toBe(true);
    });

    it('should accept placeholders in the middle of text', () => {
      const components = {
        body: {
          text: 'Hello {{1}}, your order is ready',
        },
      };

      const errors = engine.validatePlaceholders(components);
      const leadingError = errors.find(e => e.code === 'LEADING_PLACEHOLDER');
      const trailingError = errors.find(e => e.code === 'TRAILING_PLACEHOLDER');
      expect(leadingError).toBeUndefined();
      expect(trailingError).toBeUndefined();
    });

    it('should handle multiple validation errors', () => {
      const components = {
        body: {
          text: '{{1}}{{2}} and {{name}} with %s',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors.length).toBeGreaterThan(2);
      expect(errors.some(e => e.code === 'STACKED_PLACEHOLDERS')).toBe(true);
      expect(errors.some(e => e.code === 'LEADING_PLACEHOLDER')).toBe(true);
      expect(errors.some(e => e.code === 'NAMED_PLACEHOLDER')).toBe(true);
      expect(errors.some(e => e.code === 'FORMAT_SPECIFIER')).toBe(true);
    });

    it('should handle text with no placeholders', () => {
      const components = {
        body: {
          text: 'Hello, your order is ready',
        },
      };

      const errors = engine.validatePlaceholders(components);
      expect(errors).toHaveLength(0);
    });
  });

  describe('extractPlaceholders', () => {
    it('should extract placeholder numbers from text', () => {
      const text = 'Hello {{1}}, your order {{2}} is ready';
      const placeholders = engine.extractPlaceholders(text);
      expect(placeholders).toEqual([1, 2]);
    });

    it('should extract duplicate placeholders', () => {
      const text = 'Hello {{1}}, your order {{1}} is ready';
      const placeholders = engine.extractPlaceholders(text);
      expect(placeholders).toEqual([1, 1]);
    });

    it('should return empty array for text without placeholders', () => {
      const text = 'Hello, your order is ready';
      const placeholders = engine.extractPlaceholders(text);
      expect(placeholders).toEqual([]);
    });

    it('should not extract invalid placeholder formats', () => {
      const text = 'Hello {1}, your order {{name}} is ready with %s';
      const placeholders = engine.extractPlaceholders(text);
      expect(placeholders).toEqual([]);
    });

    it('should extract only valid numeric placeholders', () => {
      const text = 'Hello {{1}}, your {{name}} order {{2}} is ready';
      const placeholders = engine.extractPlaceholders(text);
      expect(placeholders).toEqual([1, 2]);
    });
  });

  describe('Full template validation with placeholders', () => {
    it('should validate complete template with valid placeholders', async () => {
      const template = {
        name: 'order_confirmation',
        category: 'TRANSACTIONAL',
        components: {
          body: {
            text: 'Hello {{1}}, your order {{2}} has been confirmed',
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

    it('should invalidate template with placeholder errors', async () => {
      const template = {
        name: 'order_confirmation',
        category: 'TRANSACTIONAL',
        components: {
          body: {
            text: '{{1}}{{2}} Hello {{name}}, your order is ready',
          },
        },
      };

      const result = await engine.validate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateButtons', () => {
    describe('Button type mixing validation', () => {
      it('should accept only Quick Reply buttons', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: 'Yes' },
          { type: 'QUICK_REPLY', text: 'No' },
        ];

        const errors = engine.validateButtons(buttons);
        const mixedError = errors.find(e => e.code === 'MIXED_BUTTON_TYPES');
        expect(mixedError).toBeUndefined();
      });

      it('should accept only Call-To-Action buttons', () => {
        const buttons = [
          { type: 'URL', text: 'Visit Website', url: 'https://example.com' },
          { type: 'PHONE_NUMBER', text: 'Call Us', phoneNumber: '+1234567890' },
        ];

        const errors = engine.validateButtons(buttons);
        const mixedError = errors.find(e => e.code === 'MIXED_BUTTON_TYPES');
        expect(mixedError).toBeUndefined();
      });

      it('should reject mixing Quick Reply with Call-To-Action buttons', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: 'Yes' },
          { type: 'URL', text: 'Visit', url: 'https://example.com' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.code === 'MIXED_BUTTON_TYPES')).toBe(true);
      });

      it('should reject mixing Quick Reply with Phone buttons', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: 'Yes' },
          { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '+1234567890' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'MIXED_BUTTON_TYPES')).toBe(true);
      });
    });

    describe('Button count limits validation', () => {
      it('should accept up to 3 Quick Reply buttons', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: 'Option 1' },
          { type: 'QUICK_REPLY', text: 'Option 2' },
          { type: 'QUICK_REPLY', text: 'Option 3' },
        ];

        const errors = engine.validateButtons(buttons);
        const countError = errors.find(e => e.code === 'TOO_MANY_QUICK_REPLY_BUTTONS');
        expect(countError).toBeUndefined();
      });

      it('should reject more than 3 Quick Reply buttons', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: 'Option 1' },
          { type: 'QUICK_REPLY', text: 'Option 2' },
          { type: 'QUICK_REPLY', text: 'Option 3' },
          { type: 'QUICK_REPLY', text: 'Option 4' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'TOO_MANY_QUICK_REPLY_BUTTONS')).toBe(true);
      });

      it('should accept up to 2 Call-To-Action buttons', () => {
        const buttons = [
          { type: 'URL', text: 'Visit', url: 'https://example.com' },
          { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '+1234567890' },
        ];

        const errors = engine.validateButtons(buttons);
        const countError = errors.find(e => e.code === 'TOO_MANY_CTA_BUTTONS');
        expect(countError).toBeUndefined();
      });

      it('should reject more than 2 Call-To-Action buttons', () => {
        const buttons = [
          { type: 'URL', text: 'Visit 1', url: 'https://example1.com' },
          { type: 'URL', text: 'Visit 2', url: 'https://example2.com' },
          { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '+1234567890' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'TOO_MANY_CTA_BUTTONS')).toBe(true);
      });
    });

    describe('Button text length validation', () => {
      it('should accept button text up to 25 characters', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: '12345678901234567890123' }, // 23 chars
        ];

        const errors = engine.validateButtons(buttons);
        const lengthError = errors.find(e => e.code === 'BUTTON_TEXT_TOO_LONG');
        expect(lengthError).toBeUndefined();
      });

      it('should reject button text exceeding 25 characters', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: '12345678901234567890123456' }, // 26 chars
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'BUTTON_TEXT_TOO_LONG')).toBe(true);
      });

      it('should reject buttons with missing text', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: '' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'BUTTON_TEXT_REQUIRED')).toBe(true);
      });

      it('should validate text length for all buttons', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: 'Valid' },
          { type: 'QUICK_REPLY', text: '12345678901234567890123456' }, // Too long
          { type: 'QUICK_REPLY', text: 'Also Valid' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'BUTTON_TEXT_TOO_LONG')).toBe(true);
        expect(errors.filter(e => e.code === 'BUTTON_TEXT_TOO_LONG')).toHaveLength(1);
      });
    });

    describe('Duplicate button text detection', () => {
      it('should accept buttons with unique text', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: 'Yes' },
          { type: 'QUICK_REPLY', text: 'No' },
          { type: 'QUICK_REPLY', text: 'Maybe' },
        ];

        const errors = engine.validateButtons(buttons);
        const duplicateError = errors.find(e => e.code === 'DUPLICATE_BUTTON_TEXT');
        expect(duplicateError).toBeUndefined();
      });

      it('should reject buttons with duplicate text (case insensitive)', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: 'Yes' },
          { type: 'QUICK_REPLY', text: 'yes' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'DUPLICATE_BUTTON_TEXT')).toBe(true);
      });

      it('should reject buttons with exact duplicate text', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: 'Confirm' },
          { type: 'QUICK_REPLY', text: 'Confirm' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'DUPLICATE_BUTTON_TEXT')).toBe(true);
      });
    });

    describe('Phone number format validation (E.164)', () => {
      it('should accept valid E.164 phone numbers', () => {
        const validNumbers = [
          '+1234567890',
          '+12345678901',
          '+123456789012',
          '+1234567890123',
          '+12345678901234',
          '+919876543210',
        ];

        validNumbers.forEach(phoneNumber => {
          const buttons = [
            { type: 'PHONE_NUMBER', text: 'Call', phoneNumber },
          ];

          const errors = engine.validateButtons(buttons);
          const phoneError = errors.find(e => e.code === 'INVALID_PHONE_FORMAT');
          expect(phoneError).toBeUndefined();
        });
      });

      it('should reject phone numbers without + prefix', () => {
        const buttons = [
          { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '1234567890' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'INVALID_PHONE_FORMAT')).toBe(true);
      });

      it('should reject phone numbers starting with +0', () => {
        const buttons = [
          { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '+0234567890' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'INVALID_PHONE_FORMAT')).toBe(true);
      });

      it('should reject phone numbers that are too short', () => {
        const buttons = [
          { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '+1' }, // Only country code, no number
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'INVALID_PHONE_FORMAT')).toBe(true);
      });

      it('should reject phone numbers that are too long', () => {
        const buttons = [
          { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '+123456789012345678' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'INVALID_PHONE_FORMAT')).toBe(true);
      });

      it('should reject phone numbers with non-numeric characters', () => {
        const buttons = [
          { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '+1234-567-890' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'INVALID_PHONE_FORMAT')).toBe(true);
      });

      it('should reject phone numbers with spaces', () => {
        const buttons = [
          { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '+1 234 567 890' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'INVALID_PHONE_FORMAT')).toBe(true);
      });

      it('should reject missing phone number', () => {
        const buttons = [
          { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'BUTTON_PHONE_REQUIRED')).toBe(true);
      });
    });

    describe('URL format validation', () => {
      it('should accept valid HTTP URLs', () => {
        const buttons = [
          { type: 'URL', text: 'Visit', url: 'http://example.com' },
        ];

        const errors = engine.validateButtons(buttons);
        const urlError = errors.find(e => e.code === 'INVALID_BUTTON_URL');
        expect(urlError).toBeUndefined();
      });

      it('should accept valid HTTPS URLs', () => {
        const buttons = [
          { type: 'URL', text: 'Visit', url: 'https://example.com' },
        ];

        const errors = engine.validateButtons(buttons);
        const urlError = errors.find(e => e.code === 'INVALID_BUTTON_URL');
        expect(urlError).toBeUndefined();
      });

      it('should accept URLs with paths and query parameters', () => {
        const buttons = [
          { type: 'URL', text: 'Visit', url: 'https://example.com/path?param=value' },
        ];

        const errors = engine.validateButtons(buttons);
        const urlError = errors.find(e => e.code === 'INVALID_BUTTON_URL');
        expect(urlError).toBeUndefined();
      });

      it('should reject invalid URL format', () => {
        const buttons = [
          { type: 'URL', text: 'Visit', url: 'not-a-valid-url' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'INVALID_BUTTON_URL')).toBe(true);
      });

      it('should reject missing URL', () => {
        const buttons = [
          { type: 'URL', text: 'Visit', url: '' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'BUTTON_URL_REQUIRED')).toBe(true);
      });

      it('should reject URL without protocol', () => {
        const buttons = [
          { type: 'URL', text: 'Visit', url: 'example.com' },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'INVALID_BUTTON_URL')).toBe(true);
      });
    });

    describe('Empty buttons array', () => {
      it('should accept empty buttons array', () => {
        const buttons = [];

        const errors = engine.validateButtons(buttons);
        expect(errors).toHaveLength(0);
      });

      it('should accept null buttons', () => {
        const errors = engine.validateButtons(null);
        expect(errors).toHaveLength(0);
      });

      it('should accept undefined buttons', () => {
        const errors = engine.validateButtons(undefined);
        expect(errors).toHaveLength(0);
      });
    });

    describe('Complex button validation scenarios', () => {
      it('should report multiple validation errors for a single button', () => {
        const buttons = [
          { 
            type: 'URL', 
            text: '12345678901234567890123456', // Too long
            url: 'invalid-url' // Invalid URL
          },
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'BUTTON_TEXT_TOO_LONG')).toBe(true);
        expect(errors.some(e => e.code === 'INVALID_BUTTON_URL')).toBe(true);
      });

      it('should validate all buttons and report all errors', () => {
        const buttons = [
          { type: 'QUICK_REPLY', text: 'Valid' },
          { type: 'QUICK_REPLY', text: '12345678901234567890123456' }, // Too long
          { type: 'QUICK_REPLY', text: 'Valid' }, // Duplicate
          { type: 'QUICK_REPLY', text: 'Fourth' }, // Too many
        ];

        const errors = engine.validateButtons(buttons);
        expect(errors.some(e => e.code === 'TOO_MANY_QUICK_REPLY_BUTTONS')).toBe(true);
        expect(errors.some(e => e.code === 'BUTTON_TEXT_TOO_LONG')).toBe(true);
        expect(errors.some(e => e.code === 'DUPLICATE_BUTTON_TEXT')).toBe(true);
      });
    });
  });

  describe('Full template validation with buttons', () => {
    it('should validate complete template with valid buttons', async () => {
      const template = {
        name: 'order_confirmation',
        category: 'TRANSACTIONAL',
        components: {
          body: {
            text: 'Hello, your order has been confirmed',
          },
          buttons: [
            { type: 'QUICK_REPLY', text: 'Track Order' },
            { type: 'QUICK_REPLY', text: 'Contact Support' },
          ],
        },
      };

      const result = await engine.validate(template);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate template with button errors', async () => {
      const template = {
        name: 'order_confirmation',
        category: 'TRANSACTIONAL',
        components: {
          body: {
            text: 'Hello, your order has been confirmed',
          },
          buttons: [
            { type: 'QUICK_REPLY', text: 'Yes' },
            { type: 'URL', text: 'Visit', url: 'https://example.com' }, // Mixed types
          ],
        },
      };

      const result = await engine.validate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MIXED_BUTTON_TYPES')).toBe(true);
    });
  });
});

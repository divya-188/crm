import { Test, TestingModule } from '@nestjs/testing';
import { TemplateValidationEngine } from '../template-validation.engine';

describe('TemplateValidationEngine - Sample Values Validation', () => {
  let engine: TemplateValidationEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateValidationEngine],
    }).compile();

    engine = module.get<TemplateValidationEngine>(TemplateValidationEngine);
  });

  describe('validateSampleValues', () => {
    describe('Basic sample value validation', () => {
      it('should accept valid sample values for all placeholders', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready',
          },
        };
        const sampleValues = {
          '1': 'John',
          '2': 'ORD-12345',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors).toHaveLength(0);
      });

      it('should reject when sample values are missing', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready',
          },
        };
        const sampleValues = null;

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.code === 'SAMPLE_VALUES_REQUIRED')).toBe(true);
      });

      it('should accept when no placeholders exist and no sample values provided', () => {
        const components = {
          body: {
            text: 'Hello, your order is ready',
          },
        };
        const sampleValues = null;

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors).toHaveLength(0);
      });
    });

    describe('Missing sample value detection', () => {
      it('should detect missing sample value for placeholder {{1}}', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready',
          },
        };
        const sampleValues = {
          '2': 'ORD-12345',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.code === 'MISSING_SAMPLE_VALUE')).toBe(true);
        expect(errors.some(e => e.field === 'sampleValues.1')).toBe(true);
      });

      it('should detect missing sample value for placeholder {{2}}', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready',
          },
        };
        const sampleValues = {
          '1': 'John',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.code === 'MISSING_SAMPLE_VALUE')).toBe(true);
        expect(errors.some(e => e.field === 'sampleValues.2')).toBe(true);
      });

      it('should detect all missing sample values', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order {{2}} with {{3}} items',
          },
        };
        const sampleValues = {
          '1': 'John',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.filter(e => e.code === 'MISSING_SAMPLE_VALUE')).toHaveLength(2);
      });

      it('should handle duplicate placeholders correctly', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your name is {{1}}',
          },
        };
        const sampleValues = {
          '1': 'John',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors).toHaveLength(0);
      });
    });

    describe('Empty sample value detection', () => {
      it('should reject empty string sample values', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': '',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.code === 'EMPTY_SAMPLE_VALUE')).toBe(true);
      });

      it('should reject whitespace-only sample values', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': '   ',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.code === 'EMPTY_SAMPLE_VALUE')).toBe(true);
      });

      it('should accept sample values with leading/trailing spaces', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': '  John  ',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        const emptyError = errors.find(e => e.code === 'EMPTY_SAMPLE_VALUE');
        expect(emptyError).toBeUndefined();
      });
    });

    describe('Sample value format validation', () => {
      it('should accept alphanumeric sample values', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John123',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors).toHaveLength(0);
      });

      it('should accept sample values with common punctuation', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': "John's Order #123",
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        const formatError = errors.find(e => e.code === 'INVALID_SAMPLE_VALUE_FORMAT');
        expect(formatError).toBeUndefined();
      });

      it('should reject sample values with angle brackets', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': '<John>',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'INVALID_SAMPLE_VALUE_FORMAT')).toBe(true);
      });

      it('should reject sample values with curly braces', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': '{John}',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'INVALID_SAMPLE_VALUE_FORMAT')).toBe(true);
      });

      it('should reject sample values with pipe character', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John|Doe',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'INVALID_SAMPLE_VALUE_FORMAT')).toBe(true);
      });

      it('should reject sample values with backslash', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John\\Doe',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'INVALID_SAMPLE_VALUE_FORMAT')).toBe(true);
      });

      it('should reject sample values with caret character', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John^Doe',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'INVALID_SAMPLE_VALUE_FORMAT')).toBe(true);
      });

      it('should reject sample values with square brackets', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': '[John]',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'INVALID_SAMPLE_VALUE_FORMAT')).toBe(true);
      });

      it('should reject sample values with control characters', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John\x00Doe',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'CONTROL_CHARACTERS_IN_SAMPLE')).toBe(true);
      });

      it('should accept sample values with URL-safe characters', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John-Doe_123',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors).toHaveLength(0);
      });
    });

    describe('Sample value length validation', () => {
      it('should accept sample values within length limit', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'A'.repeat(200), // Exactly at limit
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        const lengthError = errors.find(e => e.code === 'SAMPLE_VALUE_TOO_LONG');
        expect(lengthError).toBeUndefined();
      });

      it('should reject sample values exceeding length limit', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'A'.repeat(201), // Over limit
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'SAMPLE_VALUE_TOO_LONG')).toBe(true);
      });

      it('should accept short sample values', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'J',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors).toHaveLength(0);
      });
    });

    describe('Extra sample values detection', () => {
      it('should detect extra sample values without corresponding placeholders', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John',
          '2': 'Extra value',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'EXTRA_SAMPLE_VALUE')).toBe(true);
        expect(errors.some(e => e.field === 'sampleValues.2')).toBe(true);
      });

      it('should detect multiple extra sample values', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John',
          '2': 'Extra value 1',
          '3': 'Extra value 2',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.filter(e => e.code === 'EXTRA_SAMPLE_VALUE')).toHaveLength(2);
      });

      it('should not flag extra non-numeric keys', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John',
          'metadata': 'some metadata',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        const extraError = errors.find(e => e.code === 'EXTRA_SAMPLE_VALUE' && e.field === 'sampleValues.metadata');
        expect(extraError).toBeUndefined();
      });
    });

    describe('Header placeholder sample values', () => {
      it('should validate sample values for header placeholders', () => {
        const components = {
          header: {
            type: 'TEXT',
            text: 'Order {{1}}',
          },
          body: {
            text: 'Hello, your order is ready',
          },
        };
        const sampleValues = {
          'header_1': 'ORD-12345',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors).toHaveLength(0);
      });

      it('should detect missing header sample values', () => {
        const components = {
          header: {
            type: 'TEXT',
            text: 'Order {{1}}',
          },
          body: {
            text: 'Hello, your order is ready',
          },
        };
        const sampleValues = {};

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'MISSING_HEADER_SAMPLE_VALUE')).toBe(true);
      });

      it('should detect empty header sample values', () => {
        const components = {
          header: {
            type: 'TEXT',
            text: 'Order {{1}}',
          },
          body: {
            text: 'Hello, your order is ready',
          },
        };
        const sampleValues = {
          'header_1': '',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'EMPTY_HEADER_SAMPLE_VALUE')).toBe(true);
      });

      it('should validate both body and header sample values', () => {
        const components = {
          header: {
            type: 'TEXT',
            text: 'Order {{1}}',
          },
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready',
          },
        };
        const sampleValues = {
          'header_1': 'ORD-12345',
          '1': 'John',
          '2': 'ORD-12345',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors).toHaveLength(0);
      });

      it('should not validate header sample values for non-TEXT headers', () => {
        const components = {
          header: {
            type: 'IMAGE',
            mediaUrl: 'https://example.com/image.jpg',
          },
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors).toHaveLength(0);
      });
    });

    describe('Complex validation scenarios', () => {
      it('should report multiple validation errors for same placeholder', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': '<' + 'A'.repeat(201), // Both invalid format and too long
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'INVALID_SAMPLE_VALUE_FORMAT')).toBe(true);
        expect(errors.some(e => e.code === 'SAMPLE_VALUE_TOO_LONG')).toBe(true);
      });

      it('should validate all sample values and report all errors', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order {{2}} with {{3}} items',
          },
        };
        const sampleValues = {
          '1': '<John>', // Invalid format
          '2': '', // Empty
          // '3' is missing
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'INVALID_SAMPLE_VALUE_FORMAT')).toBe(true);
        expect(errors.some(e => e.code === 'EMPTY_SAMPLE_VALUE')).toBe(true);
        expect(errors.some(e => e.code === 'MISSING_SAMPLE_VALUE')).toBe(true);
      });
    });
  });

  describe('Full template validation with sample values', () => {
    it('should validate complete template with valid sample values', async () => {
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

    it('should invalidate template with missing sample values', async () => {
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
          // Missing '2'
        },
      };

      const result = await engine.validate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_SAMPLE_VALUE')).toBe(true);
    });

    it('should invalidate template with invalid sample value format', async () => {
      const template = {
        name: 'order_confirmation',
        category: 'TRANSACTIONAL',
        components: {
          body: {
            text: 'Hello {{1}}, your order {{2}} has been confirmed',
          },
        },
        sampleValues: {
          '1': '<John>',
          '2': 'ORD-12345',
        },
      };

      const result = await engine.validate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_SAMPLE_VALUE_FORMAT')).toBe(true);
    });

    it('should validate template with header and body sample values', async () => {
      const template = {
        name: 'order_confirmation',
        category: 'TRANSACTIONAL',
        components: {
          header: {
            type: 'TEXT',
            text: 'Order {{1}}',
          },
          body: {
            text: 'Hello {{1}}, your order has been confirmed',
          },
        },
        sampleValues: {
          'header_1': 'ORD-12345',
          '1': 'John',
        },
      };

      const result = await engine.validate(template);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

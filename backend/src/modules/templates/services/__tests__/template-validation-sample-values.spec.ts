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
    describe('Required sample values', () => {
      it('should require sample values when placeholders exist', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready',
          },
        };
        const sampleValues = null;

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'SAMPLE_VALUES_REQUIRED')).toBe(true);
      });

      it('should not require sample values when no placeholders exist', () => {
        const components = {
          body: {
            text: 'Hello, your order is ready',
          },
        };
        const sampleValues = null;

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors).toHaveLength(0);
      });

      it('should require sample value for each placeholder', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready',
          },
        };
        const sampleValues = {
          '1': 'John',
          // Missing sample value for {{2}}
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'MISSING_SAMPLE_VALUE' && e.field === 'sampleValues.2')).toBe(true);
      });

      it('should accept all required sample values', () => {
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
        const missingError = errors.find(e => e.code === 'MISSING_SAMPLE_VALUE');
        expect(missingError).toBeUndefined();
      });
    });

    describe('Empty sample values', () => {
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
        expect(errors.some(e => e.code === 'EMPTY_SAMPLE_VALUE')).toBe(true);
      });

      it('should accept non-empty sample values', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        const emptyError = errors.find(e => e.code === 'EMPTY_SAMPLE_VALUE');
        expect(emptyError).toBeUndefined();
      });
    });

    describe('Sample value format validation', () => {
      it('should reject sample values with special characters that break URLs', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John<script>',
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

      it('should accept sample values with normal characters', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John Doe',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        const formatError = errors.find(e => e.code === 'INVALID_SAMPLE_VALUE_FORMAT');
        expect(formatError).toBeUndefined();
      });
    });

    describe('Sample value length validation', () => {
      it('should reject sample values exceeding 200 characters', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'a'.repeat(201),
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'SAMPLE_VALUE_TOO_LONG')).toBe(true);
      });

      it('should accept sample values up to 200 characters', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'a'.repeat(200),
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        const lengthError = errors.find(e => e.code === 'SAMPLE_VALUE_TOO_LONG');
        expect(lengthError).toBeUndefined();
      });
    });

    describe('Extra sample values', () => {
      it('should warn about extra sample values without placeholders', () => {
        const components = {
          body: {
            text: 'Hello {{1}}, your order is ready',
          },
        };
        const sampleValues = {
          '1': 'John',
          '2': 'Extra value',
          '3': 'Another extra',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'EXTRA_SAMPLE_VALUE' && e.field === 'sampleValues.2')).toBe(true);
        expect(errors.some(e => e.code === 'EXTRA_SAMPLE_VALUE' && e.field === 'sampleValues.3')).toBe(true);
      });

      it('should not warn when sample values match placeholders', () => {
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
        const extraError = errors.find(e => e.code === 'EXTRA_SAMPLE_VALUE');
        expect(extraError).toBeUndefined();
      });
    });

    describe('Header placeholder sample values', () => {
      it('should require sample values for header placeholders', () => {
        const components = {
          header: {
            type: 'TEXT',
            text: 'Order {{1}}',
          },
          body: {
            text: 'Your order is ready',
          },
        };
        const sampleValues = {};

        const errors = engine.validateSampleValues(components, sampleValues);
        expect(errors.some(e => e.code === 'MISSING_HEADER_SAMPLE_VALUE')).toBe(true);
      });

      it('should accept sample values for header placeholders', () => {
        const components = {
          header: {
            type: 'TEXT',
            text: 'Order {{1}}',
          },
          body: {
            text: 'Your order is ready',
          },
        };
        const sampleValues = {
          'header_1': 'ORD-12345',
        };

        const errors = engine.validateSampleValues(components, sampleValues);
        const headerError = errors.find(e => e.code === 'MISSING_HEADER_SAMPLE_VALUE');
        expect(headerError).toBeUndefined();
      });
    });
  });
});

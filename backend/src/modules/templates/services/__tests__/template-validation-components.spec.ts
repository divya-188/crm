import { Test, TestingModule } from '@nestjs/testing';
import { TemplateValidationEngine } from '../template-validation.engine';

describe('TemplateValidationEngine - Component Validation', () => {
  let engine: TemplateValidationEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateValidationEngine],
    }).compile();

    engine = module.get<TemplateValidationEngine>(TemplateValidationEngine);
  });

  describe('validateComponents', () => {
    describe('Body component validation', () => {
      it('should require body text', () => {
        const components = {};

        const errors = engine.validateComponents(components);
        expect(errors.some(e => e.code === 'BODY_REQUIRED')).toBe(true);
      });

      it('should require body text to not be empty', () => {
        const components = {
          body: {},
        };

        const errors = engine.validateComponents(components);
        expect(errors.some(e => e.code === 'BODY_REQUIRED')).toBe(true);
      });

      it('should accept valid body text', () => {
        const components = {
          body: {
            text: 'This is a valid body text',
          },
        };

        const errors = engine.validateComponents(components);
        const bodyError = errors.find(e => e.code === 'BODY_REQUIRED');
        expect(bodyError).toBeUndefined();
      });

      it('should reject body text exceeding 1024 characters', () => {
        const components = {
          body: {
            text: 'a'.repeat(1025),
          },
        };

        const errors = engine.validateComponents(components);
        expect(errors.some(e => e.code === 'BODY_TOO_LONG')).toBe(true);
      });

      it('should accept body text up to 1024 characters', () => {
        const components = {
          body: {
            text: 'a'.repeat(1024),
          },
        };

        const errors = engine.validateComponents(components);
        const bodyLengthError = errors.find(e => e.code === 'BODY_TOO_LONG');
        expect(bodyLengthError).toBeUndefined();
      });
    });

    describe('Header component validation', () => {
      it('should accept header with TEXT type', () => {
        const components = {
          body: { text: 'Body text' },
          header: {
            type: 'TEXT',
            text: 'Header text',
          },
        };

        const errors = engine.validateComponents(components);
        const headerError = errors.find(e => e.field === 'components.header.text');
        expect(headerError).toBeUndefined();
      });

      it('should reject header text exceeding 60 characters', () => {
        const components = {
          body: { text: 'Body text' },
          header: {
            type: 'TEXT',
            text: 'a'.repeat(61),
          },
        };

        const errors = engine.validateComponents(components);
        expect(errors.some(e => e.code === 'HEADER_TEXT_TOO_LONG')).toBe(true);
      });

      it('should accept header text up to 60 characters', () => {
        const components = {
          body: { text: 'Body text' },
          header: {
            type: 'TEXT',
            text: 'a'.repeat(60),
          },
        };

        const errors = engine.validateComponents(components);
        const headerError = errors.find(e => e.code === 'HEADER_TEXT_TOO_LONG');
        expect(headerError).toBeUndefined();
      });

      it('should accept header with IMAGE type', () => {
        const components = {
          body: { text: 'Body text' },
          header: {
            type: 'IMAGE',
            mediaHandle: 'media_123',
          },
        };

        const errors = engine.validateComponents(components);
        const headerError = errors.find(e => e.field.includes('header'));
        expect(headerError).toBeUndefined();
      });
    });

    describe('Footer component validation', () => {
      it('should accept footer text', () => {
        const components = {
          body: { text: 'Body text' },
          footer: {
            text: 'Footer text',
          },
        };

        const errors = engine.validateComponents(components);
        const footerError = errors.find(e => e.field === 'components.footer.text');
        expect(footerError).toBeUndefined();
      });

      it('should reject footer text exceeding 60 characters', () => {
        const components = {
          body: { text: 'Body text' },
          footer: {
            text: 'a'.repeat(61),
          },
        };

        const errors = engine.validateComponents(components);
        expect(errors.some(e => e.code === 'FOOTER_TOO_LONG')).toBe(true);
      });

      it('should accept footer text up to 60 characters', () => {
        const components = {
          body: { text: 'Body text' },
          footer: {
            text: 'a'.repeat(60),
          },
        };

        const errors = engine.validateComponents(components);
        const footerError = errors.find(e => e.code === 'FOOTER_TOO_LONG');
        expect(footerError).toBeUndefined();
      });

      it('should reject footer with placeholders', () => {
        const components = {
          body: { text: 'Body text' },
          footer: {
            text: 'Footer with {{1}} placeholder',
          },
        };

        const errors = engine.validateComponents(components);
        expect(errors.some(e => e.code === 'FOOTER_HAS_PLACEHOLDERS')).toBe(true);
      });

      it('should accept footer without placeholders', () => {
        const components = {
          body: { text: 'Body text' },
          footer: {
            text: 'Footer without placeholders',
          },
        };

        const errors = engine.validateComponents(components);
        const footerPlaceholderError = errors.find(e => e.code === 'FOOTER_HAS_PLACEHOLDERS');
        expect(footerPlaceholderError).toBeUndefined();
      });
    });
  });
});

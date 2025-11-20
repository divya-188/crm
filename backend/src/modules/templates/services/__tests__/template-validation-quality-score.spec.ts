import { Test, TestingModule } from '@nestjs/testing';
import { TemplateValidationEngine } from '../template-validation.engine';

describe('TemplateValidationEngine - Quality Score Calculation', () => {
  let engine: TemplateValidationEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateValidationEngine],
    }).compile();

    engine = module.get<TemplateValidationEngine>(TemplateValidationEngine);
  });

  describe('calculateQualityScore', () => {
    describe('Body length scoring', () => {
      it('should penalize very short body text (< 50 chars)', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Short text',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        expect(result.score).toBeLessThan(100);
        expect(result.breakdown.some(b => b.category === 'Body Length' && b.points < 0)).toBe(true);
      });

      it('should penalize very long body text (> 1000 chars)', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'a'.repeat(1001),
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        expect(result.score).toBeLessThan(100);
        expect(result.breakdown.some(b => b.category === 'Body Length' && b.points === -15)).toBe(true);
      });

      it('should penalize long body text (> 800 chars)', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'a'.repeat(801),
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        expect(result.score).toBeLessThan(100);
        expect(result.breakdown.some(b => b.category === 'Body Length' && b.points === -10)).toBe(true);
      });

      it('should reward optimal body length (50-500 chars)', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'This is an optimal length message that provides clear information to the customer without being too short or too long.',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        expect(result.breakdown.some(b => b.category === 'Body Length' && b.points === 5)).toBe(true);
      });

      it('should be neutral for acceptable length (500-800 chars)', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'a'.repeat(600),
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const bodyLengthScore = result.breakdown.find(b => b.category === 'Body Length');
        expect(bodyLengthScore.points).toBe(0);
      });
    });

    describe('Component completeness scoring', () => {
      it('should reward templates with all components', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          description: 'A complete template',
          components: {
            header: {
              type: 'TEXT',
              text: 'Order Confirmation',
            },
            body: {
              text: 'Your order has been confirmed. Thank you for shopping with us!',
            },
            footer: {
              text: 'Reply STOP to unsubscribe',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const completenessScore = result.breakdown.find(b => b.category === 'Component Completeness');
        expect(completenessScore.points).toBe(13); // 5 (footer) + 5 (description) + 3 (header)
      });

      it('should reward templates with footer', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Your order has been confirmed.',
            },
            footer: {
              text: 'Reply STOP to unsubscribe',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const completenessScore = result.breakdown.find(b => b.category === 'Component Completeness');
        expect(completenessScore.points).toBeGreaterThanOrEqual(5);
      });

      it('should reward templates with description', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          description: 'Order confirmation template',
          components: {
            body: {
              text: 'Your order has been confirmed.',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const completenessScore = result.breakdown.find(b => b.category === 'Component Completeness');
        expect(completenessScore.points).toBeGreaterThanOrEqual(5);
      });

      it('should reward templates with header', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            header: {
              type: 'TEXT',
              text: 'Order Update',
            },
            body: {
              text: 'Your order has been confirmed.',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const completenessScore = result.breakdown.find(b => b.category === 'Component Completeness');
        expect(completenessScore.points).toBeGreaterThanOrEqual(3);
      });

      it('should not reward templates with minimal components', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Your order has been confirmed.',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const completenessScore = result.breakdown.find(b => b.category === 'Component Completeness');
        expect(completenessScore.points).toBe(0);
      });
    });

    describe('Placeholder usage scoring', () => {
      it('should penalize excessive placeholders (> 5)', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Hello {{1}}, order {{2}} with {{3}} items totaling {{4}} will arrive on {{5}} at {{6}}',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const placeholderScore = result.breakdown.find(b => b.category === 'Placeholder Usage');
        expect(placeholderScore.points).toBe(-10);
      });

      it('should slightly penalize many placeholders (4-5)', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Hello {{1}}, order {{2}} with {{3}} items totaling {{4}}',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const placeholderScore = result.breakdown.find(b => b.category === 'Placeholder Usage');
        expect(placeholderScore.points).toBe(-5);
      });

      it('should not penalize optimal placeholder count (1-3)', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Hello {{1}}, your order {{2}} is ready',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const placeholderScore = result.breakdown.find(b => b.category === 'Placeholder Usage');
        expect(placeholderScore.points).toBe(0);
      });

      it('should not penalize templates without placeholders', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Your order has been confirmed',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const placeholderScore = result.breakdown.find(b => b.category === 'Placeholder Usage');
        expect(placeholderScore.points).toBe(0);
      });
    });

    describe('Spam indicators scoring', () => {
      it('should heavily penalize spam language', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Buy now! Limited time offer! Act fast!',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const spamScore = result.breakdown.find(b => b.category === 'Policy Compliance');
        expect(spamScore.points).toBeLessThan(0);
      });

      it('should heavily penalize sensitive data requests', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Please provide your credit card and password',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const spamScore = result.breakdown.find(b => b.category === 'Policy Compliance');
        expect(spamScore.points).toBeLessThan(0);
      });

      it('should not penalize clean templates', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Your order has been confirmed. Thank you for shopping with us!',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const spamScore = result.breakdown.find(b => b.category === 'Policy Compliance');
        expect(spamScore.points).toBe(0);
      });
    });

    describe('Overall quality score', () => {
      it('should return score between 0 and 100', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Test message',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      });

      it('should return Excellent rating for high scores (>= 90)', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          description: 'A high quality template',
          components: {
            header: {
              type: 'TEXT',
              text: 'Order Confirmation',
            },
            body: {
              text: 'Hello, your order has been confirmed. We will notify you when it ships. Thank you for shopping with us!',
            },
            footer: {
              text: 'Reply STOP to unsubscribe',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        expect(result.score).toBeGreaterThanOrEqual(90);
        expect(result.rating).toBe('Excellent');
      });

      it('should return Good rating for scores 75-89', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Hello, your order has been confirmed. Thank you for shopping with us!',
            },
            footer: {
              text: 'Reply STOP to unsubscribe',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        expect(result.score).toBeGreaterThanOrEqual(75);
        expect(result.rating).toBe('Good');
      });

      it('should return Poor rating for low quality templates', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Buy now! Limited time! Act fast! Click here! Urgent! Guaranteed!',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        expect(result.score).toBeLessThan(60);
        expect(['Poor', 'Very Poor']).toContain(result.rating);
      });

      it('should include breakdown with all categories', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Your order has been confirmed.',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        expect(result.breakdown).toBeDefined();
        expect(result.breakdown.length).toBeGreaterThan(0);
        
        const categories = result.breakdown.map(b => b.category);
        expect(categories).toContain('Body Length');
        expect(categories).toContain('Component Completeness');
        expect(categories).toContain('Placeholder Usage');
        expect(categories).toContain('Policy Compliance');
      });

      it('should provide suggestions for improvement', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Short',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        const itemsWithSuggestions = result.breakdown.filter(b => b.suggestion && b.suggestion.length > 0);
        expect(itemsWithSuggestions.length).toBeGreaterThan(0);
      });
    });

    describe('Quality score edge cases', () => {
      it('should handle template with all negative factors', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Buy now with credit card! {{1}} {{2}} {{3}} {{4}} {{5}} {{6}} Limited time!',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThan(50);
      });

      it('should handle template with all positive factors', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          description: 'Perfect template',
          components: {
            header: {
              type: 'TEXT',
              text: 'Order Confirmation',
            },
            body: {
              text: 'Hello, your order has been successfully confirmed. We appreciate your business and will keep you updated on the shipping status. Thank you for choosing our service!',
            },
            footer: {
              text: 'Reply STOP to unsubscribe',
            },
          },
        };

        const result = engine.calculateQualityScore(template);
        expect(result.score).toBeGreaterThan(90);
      });
    });
  });
});

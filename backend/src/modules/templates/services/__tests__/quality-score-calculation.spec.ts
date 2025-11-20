import { TemplateValidationEngine, QualityScoreBreakdown } from '../template-validation.engine';

describe('TemplateValidationEngine - Quality Score Calculation', () => {
  let engine: TemplateValidationEngine;

  beforeEach(() => {
    engine = new TemplateValidationEngine(null);
  });

  describe('calculateQualityScore', () => {
    it('should return a score between 0 and 100', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready for pickup.',
          },
        },
        sampleValues: {
          '1': 'John',
          '2': '#12345',
        },
      };

      const result = engine.calculateQualityScore(template);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown).toBeDefined();
      expect(result.rating).toBeDefined();
    });

    it('should return breakdown with all scoring categories', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Hello {{1}}, your order is ready.',
          },
        },
        sampleValues: {
          '1': 'John',
        },
      };

      const result = engine.calculateQualityScore(template);

      expect(result.breakdown).toHaveLength(4);
      expect(result.breakdown[0].category).toBe('Body Length');
      expect(result.breakdown[1].category).toBe('Component Completeness');
      expect(result.breakdown[2].category).toBe('Placeholder Usage');
      expect(result.breakdown[3].category).toBe('Policy Compliance');
    });
  });

  describe('Body Length Scoring', () => {
    it('should penalize very short body text (< 50 chars)', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Hi {{1}}',
          },
        },
        sampleValues: {
          '1': 'John',
        },
      };

      const result = engine.calculateQualityScore(template);
      const bodyLengthScore = result.breakdown.find(d => d.category === 'Body Length');

      expect(bodyLengthScore).toBeDefined();
      expect(bodyLengthScore!.points).toBe(-10);
      expect(bodyLengthScore!.message).toContain('too short');
      expect(bodyLengthScore!.suggestion).toBeTruthy();
    });

    it('should reward optimal body text length (50-500 chars)', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Hello {{1}}, your order {{2}} has been confirmed and is being prepared. You will receive a notification when it is ready for pickup at our store.',
          },
        },
        sampleValues: {
          '1': 'John',
          '2': '#12345',
        },
      };

      const result = engine.calculateQualityScore(template);
      const bodyLengthScore = result.breakdown.find(d => d.category === 'Body Length');

      expect(bodyLengthScore).toBeDefined();
      expect(bodyLengthScore!.points).toBe(5);
      expect(bodyLengthScore!.message).toContain('optimal');
    });

    it('should penalize long body text (> 800 chars)', () => {
      const longText = 'A'.repeat(850);
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: longText,
          },
        },
        sampleValues: {},
      };

      const result = engine.calculateQualityScore(template);
      const bodyLengthScore = result.breakdown.find(d => d.category === 'Body Length');

      expect(bodyLengthScore).toBeDefined();
      expect(bodyLengthScore!.points).toBe(-10);
      expect(bodyLengthScore!.message).toContain('quite long');
    });

    it('should heavily penalize very long body text (> 1000 chars)', () => {
      const veryLongText = 'A'.repeat(1020);
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: veryLongText,
          },
        },
        sampleValues: {},
      };

      const result = engine.calculateQualityScore(template);
      const bodyLengthScore = result.breakdown.find(d => d.category === 'Body Length');

      expect(bodyLengthScore).toBeDefined();
      expect(bodyLengthScore!.points).toBe(-15);
      expect(bodyLengthScore!.message).toContain('excessively long');
    });

    it('should be neutral for acceptable length (500-800 chars)', () => {
      const acceptableText = 'A'.repeat(650);
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: acceptableText,
          },
        },
        sampleValues: {},
      };

      const result = engine.calculateQualityScore(template);
      const bodyLengthScore = result.breakdown.find(d => d.category === 'Body Length');

      expect(bodyLengthScore).toBeDefined();
      expect(bodyLengthScore!.points).toBe(0);
      expect(bodyLengthScore!.message).toContain('acceptable');
    });
  });

  describe('Component Completeness Scoring', () => {
    it('should reward templates with footer', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Hello {{1}}, your order is ready.',
          },
          footer: {
            text: 'Reply STOP to unsubscribe',
          },
        },
        sampleValues: {
          '1': 'John',
        },
      };

      const result = engine.calculateQualityScore(template);
      const completenessScore = result.breakdown.find(d => d.category === 'Component Completeness');

      expect(completenessScore).toBeDefined();
      expect(completenessScore!.points).toBeGreaterThanOrEqual(5);
    });

    it('should reward templates with description', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        description: 'Order confirmation template',
        components: {
          body: {
            text: 'Hello {{1}}, your order is ready.',
          },
        },
        sampleValues: {
          '1': 'John',
        },
      };

      const result = engine.calculateQualityScore(template);
      const completenessScore = result.breakdown.find(d => d.category === 'Component Completeness');

      expect(completenessScore).toBeDefined();
      expect(completenessScore!.points).toBeGreaterThanOrEqual(5);
    });

    it('should reward templates with header', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          header: {
            type: 'TEXT',
            text: 'Order Update',
          },
          body: {
            text: 'Hello {{1}}, your order is ready.',
          },
        },
        sampleValues: {
          '1': 'John',
        },
      };

      const result = engine.calculateQualityScore(template);
      const completenessScore = result.breakdown.find(d => d.category === 'Component Completeness');

      expect(completenessScore).toBeDefined();
      expect(completenessScore!.points).toBeGreaterThanOrEqual(3);
    });

    it('should give maximum points for complete template (header, footer, description)', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        description: 'Complete order confirmation template',
        components: {
          header: {
            type: 'TEXT',
            text: 'Order Update',
          },
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready for pickup.',
          },
          footer: {
            text: 'Reply STOP to unsubscribe',
          },
        },
        sampleValues: {
          '1': 'John',
          '2': '#12345',
        },
      };

      const result = engine.calculateQualityScore(template);
      const completenessScore = result.breakdown.find(d => d.category === 'Component Completeness');

      expect(completenessScore).toBeDefined();
      expect(completenessScore!.points).toBe(13); // 5 + 5 + 3
      expect(completenessScore!.message).toContain('all recommended components');
    });

    it('should give 0 points for minimal template', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Hello {{1}}, your order is ready.',
          },
        },
        sampleValues: {
          '1': 'John',
        },
      };

      const result = engine.calculateQualityScore(template);
      const completenessScore = result.breakdown.find(d => d.category === 'Component Completeness');

      expect(completenessScore).toBeDefined();
      expect(completenessScore!.points).toBe(0);
      expect(completenessScore!.suggestion).toBeTruthy();
    });
  });

  describe('Placeholder Usage Scoring', () => {
    it('should not penalize templates with 1-3 placeholders', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready at {{3}}.',
          },
        },
        sampleValues: {
          '1': 'John',
          '2': '#12345',
          '3': 'Store A',
        },
      };

      const result = engine.calculateQualityScore(template);
      const placeholderScore = result.breakdown.find(d => d.category === 'Placeholder Usage');

      expect(placeholderScore).toBeDefined();
      expect(placeholderScore!.points).toBe(0);
      expect(placeholderScore!.message).toContain('optimal range');
    });

    it('should penalize templates with 4-5 placeholders', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Hello {{1}}, order {{2}} at {{3}} on {{4}} for {{5}}.',
          },
        },
        sampleValues: {
          '1': 'John',
          '2': '#12345',
          '3': 'Store A',
          '4': '2024-01-01',
          '5': '$50',
        },
      };

      const result = engine.calculateQualityScore(template);
      const placeholderScore = result.breakdown.find(d => d.category === 'Placeholder Usage');

      expect(placeholderScore).toBeDefined();
      expect(placeholderScore!.points).toBe(-5);
      expect(placeholderScore!.message).toContain('many placeholders');
    });

    it('should heavily penalize templates with > 5 placeholders', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Hi {{1}}, order {{2}} at {{3}} on {{4}} for {{5}} with {{6}} items.',
          },
        },
        sampleValues: {
          '1': 'John',
          '2': '#12345',
          '3': 'Store A',
          '4': '2024-01-01',
          '5': '$50',
          '6': '3',
        },
      };

      const result = engine.calculateQualityScore(template);
      const placeholderScore = result.breakdown.find(d => d.category === 'Placeholder Usage');

      expect(placeholderScore).toBeDefined();
      expect(placeholderScore!.points).toBe(-10);
      expect(placeholderScore!.message).toContain('excessive placeholders');
      expect(placeholderScore!.suggestion).toContain('Reduce the number');
    });

    it('should handle templates with no placeholders', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Thank you for your order!',
          },
        },
        sampleValues: {},
      };

      const result = engine.calculateQualityScore(template);
      const placeholderScore = result.breakdown.find(d => d.category === 'Placeholder Usage');

      expect(placeholderScore).toBeDefined();
      expect(placeholderScore!.points).toBe(0);
      expect(placeholderScore!.message).toContain('no placeholders');
    });
  });

  describe('Spam Indicator Detection and Scoring', () => {
    it('should penalize templates with spam language', () => {
      const template = {
        name: 'test_template',
        category: 'MARKETING',
        components: {
          body: {
            text: 'Buy now! Limited time offer. Act fast before it expires!',
          },
        },
        sampleValues: {},
      };

      const result = engine.calculateQualityScore(template);
      const spamScore = result.breakdown.find(d => d.category === 'Policy Compliance');

      expect(spamScore).toBeDefined();
      expect(spamScore!.points).toBeLessThan(0);
      expect(spamScore!.message).toContain('spam language');
      expect(spamScore!.suggestion).toContain('Remove urgency tactics');
    });

    it('should heavily penalize templates requesting sensitive data', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Please provide your credit card number and CVV to complete the order.',
          },
        },
        sampleValues: {},
      };

      const result = engine.calculateQualityScore(template);
      const spamScore = result.breakdown.find(d => d.category === 'Policy Compliance');

      expect(spamScore).toBeDefined();
      expect(spamScore!.points).toBeLessThan(0);
      expect(spamScore!.message).toContain('sensitive data requests');
      expect(spamScore!.suggestion).toContain('Never request sensitive information');
    });

    it('should cap spam language penalty at -30 points', () => {
      const template = {
        name: 'test_template',
        category: 'MARKETING',
        components: {
          body: {
            text: 'Buy now! Limited time! Act fast! Click here! Urgent! Hurry! Don\'t miss! Guaranteed!',
          },
        },
        sampleValues: {},
      };

      const result = engine.calculateQualityScore(template);
      const spamScore = result.breakdown.find(d => d.category === 'Policy Compliance');

      expect(spamScore).toBeDefined();
      expect(spamScore!.points).toBeGreaterThanOrEqual(-30);
    });

    it('should cap sensitive data penalty at -40 points', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Provide credit card, CVV, SSN, password, PIN, and bank account.',
          },
        },
        sampleValues: {},
      };

      const result = engine.calculateQualityScore(template);
      const spamScore = result.breakdown.find(d => d.category === 'Policy Compliance');

      expect(spamScore).toBeDefined();
      expect(spamScore!.points).toBeGreaterThanOrEqual(-40);
    });

    it('should not penalize clean templates', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready for pickup at our store.',
          },
        },
        sampleValues: {
          '1': 'John',
          '2': '#12345',
        },
      };

      const result = engine.calculateQualityScore(template);
      const spamScore = result.breakdown.find(d => d.category === 'Policy Compliance');

      expect(spamScore).toBeDefined();
      expect(spamScore!.points).toBe(0);
      expect(spamScore!.message).toContain('No spam indicators');
    });
  });

  describe('Quality Rating', () => {
    it('should rate excellent templates (>= 90)', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        description: 'Perfect template',
        components: {
          header: {
            type: 'TEXT',
            text: 'Order Update',
          },
          body: {
            text: 'Hello {{1}}, your order {{2}} has been confirmed and is being prepared. You will receive a notification when it is ready for pickup.',
          },
          footer: {
            text: 'Reply STOP to unsubscribe',
          },
        },
        sampleValues: {
          '1': 'John',
          '2': '#12345',
        },
      };

      const result = engine.calculateQualityScore(template);

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.rating).toBe('Excellent');
    });

    it('should rate good templates (75-89)', () => {
      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Hello {{1}}, your order {{2}} has been confirmed.',
          },
        },
        sampleValues: {
          '1': 'John',
          '2': '#12345',
        },
      };

      const result = engine.calculateQualityScore(template);

      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.score).toBeLessThan(90);
      expect(result.rating).toBe('Good');
    });

    it('should rate poor templates with spam language', () => {
      const template = {
        name: 'test_template',
        category: 'MARKETING',
        components: {
          body: {
            text: 'Buy now! Limited time offer!',
          },
        },
        sampleValues: {},
      };

      const result = engine.calculateQualityScore(template);

      expect(result.score).toBeLessThan(75);
      expect(['Fair', 'Poor', 'Very Poor']).toContain(result.rating);
    });
  });

  describe('Complete Quality Score Calculation', () => {
    it('should calculate comprehensive score for a perfect template', () => {
      const template = {
        name: 'order_confirmation',
        category: 'TRANSACTIONAL',
        description: 'Order confirmation message for customers',
        components: {
          header: {
            type: 'TEXT',
            text: 'Order Confirmed',
          },
          body: {
            text: 'Hello {{1}}, thank you for your order! Your order {{2}} has been confirmed and will be delivered to {{3}} by {{4}}. Track your order using the link below.',
          },
          footer: {
            text: 'Reply STOP to unsubscribe',
          },
        },
        sampleValues: {
          '1': 'John Doe',
          '2': '#ORD-12345',
          '3': '123 Main St',
          '4': 'Jan 15, 2024',
        },
      };

      const result = engine.calculateQualityScore(template);

      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.breakdown).toHaveLength(4);
      expect(result.rating).toMatch(/Excellent|Good/);
      
      // Verify all categories are present
      const categories = result.breakdown.map(d => d.category);
      expect(categories).toContain('Body Length');
      expect(categories).toContain('Component Completeness');
      expect(categories).toContain('Placeholder Usage');
      expect(categories).toContain('Policy Compliance');
    });

    it('should calculate low score for problematic template', () => {
      const template = {
        name: 'bad_template',
        category: 'MARKETING',
        components: {
          body: {
            text: 'Buy now! Limited time! Enter your credit card and CVV!',
          },
        },
        sampleValues: {},
      };

      const result = engine.calculateQualityScore(template);

      expect(result.score).toBeLessThan(60);
      expect(result.rating).toMatch(/Poor|Very Poor/);
      
      // Should have negative points from spam and sensitive data
      const policyScore = result.breakdown.find(d => d.category === 'Policy Compliance');
      expect(policyScore!.points).toBeLessThan(0);
    });
  });
});

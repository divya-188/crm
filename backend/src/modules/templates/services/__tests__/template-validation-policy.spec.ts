import { Test, TestingModule } from '@nestjs/testing';
import { TemplateValidationEngine } from '../template-validation.engine';

describe('TemplateValidationEngine - Policy Violation Detection', () => {
  let engine: TemplateValidationEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateValidationEngine],
    }).compile();

    engine = module.get<TemplateValidationEngine>(TemplateValidationEngine);
  });

  describe('checkPolicyViolations', () => {
    describe('Sensitive data detection', () => {
      it('should detect credit card requests', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Please provide your credit card number',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SENSITIVE_DATA')).toBe(true);
        expect(errors.some(e => e.message.includes('credit card'))).toBe(true);
      });

      it('should detect CVV requests', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Enter your CVV code',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SENSITIVE_DATA')).toBe(true);
        expect(errors.some(e => e.message.includes('CVV'))).toBe(true);
      });

      it('should detect SSN requests', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Please provide your social security number',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SENSITIVE_DATA')).toBe(true);
      });

      it('should detect password requests', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Enter your password to continue',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SENSITIVE_DATA')).toBe(true);
        expect(errors.some(e => e.message.includes('password'))).toBe(true);
      });

      it('should detect PIN requests', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Please enter your PIN code',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SENSITIVE_DATA')).toBe(true);
      });

      it('should detect bank account requests', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Provide your bank account details',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SENSITIVE_DATA')).toBe(true);
      });

      it('should detect debit card requests', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Enter your debit card information',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SENSITIVE_DATA')).toBe(true);
      });

      it('should not flag safe content', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Your order has been confirmed. Thank you for shopping with us!',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        const sensitiveError = errors.find(e => e.code === 'POLICY_VIOLATION_SENSITIVE_DATA');
        expect(sensitiveError).toBeUndefined();
      });

      it('should detect sensitive data in header', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            header: {
              type: 'TEXT',
              text: 'Enter your password',
            },
            body: {
              text: 'Please verify your account',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SENSITIVE_DATA')).toBe(true);
      });

      it('should detect sensitive data in footer', () => {
        const template = {
          name: 'test',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Please verify your account',
            },
            footer: {
              text: 'Reply with your credit card',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SENSITIVE_DATA')).toBe(true);
      });
    });

    describe('Spam language detection', () => {
      it('should detect "buy now" spam language', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Buy now and get 50% off!',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SPAM_LANGUAGE')).toBe(true);
        expect(errors.some(e => e.message.includes('buy now'))).toBe(true);
      });

      it('should detect "limited time" spam language', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Limited time offer - act fast!',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SPAM_LANGUAGE')).toBe(true);
      });

      it('should detect "act fast" spam language', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Act fast before this deal expires!',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SPAM_LANGUAGE')).toBe(true);
      });

      it('should detect "click here" spam language', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Click here to claim your prize!',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SPAM_LANGUAGE')).toBe(true);
      });

      it('should detect "urgent" spam language', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Urgent: Your account needs attention',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SPAM_LANGUAGE')).toBe(true);
      });

      it('should detect "guaranteed" spam language', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Guaranteed results or your money back',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SPAM_LANGUAGE')).toBe(true);
      });

      it('should not flag normal marketing language', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Check out our new collection. Visit our store today.',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        const spamError = errors.find(e => e.code === 'POLICY_VIOLATION_SPAM_LANGUAGE');
        expect(spamError).toBeUndefined();
      });
    });

    describe('Multiple policy violations', () => {
      it('should detect both sensitive data and spam language', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Buy now with your credit card! Limited time offer!',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SENSITIVE_DATA')).toBe(true);
        expect(errors.some(e => e.code === 'POLICY_VIOLATION_SPAM_LANGUAGE')).toBe(true);
      });

      it('should detect violations across multiple components', () => {
        const template = {
          name: 'test',
          category: 'MARKETING',
          components: {
            header: {
              type: 'TEXT',
              text: 'Urgent offer!',
            },
            body: {
              text: 'Enter your password to claim',
            },
            footer: {
              text: 'Act now!',
            },
          },
        };

        const errors = engine.checkPolicyViolations(template);
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });
});

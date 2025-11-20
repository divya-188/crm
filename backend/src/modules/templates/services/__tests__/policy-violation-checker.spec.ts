import { Test, TestingModule } from '@nestjs/testing';
import { TemplateValidationEngine, DEFAULT_POLICY_RULES } from '../template-validation.engine';

describe('TemplateValidationEngine - Policy Violation Checker', () => {
  let validationEngine: TemplateValidationEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateValidationEngine],
    }).compile();

    validationEngine = module.get<TemplateValidationEngine>(TemplateValidationEngine);
  });

  describe('checkPolicyViolations', () => {
    describe('Sensitive Data Detection', () => {
      it('should detect credit card requests in body text', async () => {
        const template = {
          name: 'test_template',
          category: 'UTILITY',
          components: {
            body: {
              text: 'Please provide your credit card number to complete the payment.',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.body.text',
              code: 'POLICY_VIOLATION_SENSITIVE_DATA',
              message: expect.stringContaining('credit card'),
            }),
          ]),
        );
      });

      it('should detect CVV requests', async () => {
        const template = {
          name: 'test_template',
          category: 'UTILITY',
          components: {
            body: {
              text: 'Enter your CVV code to verify the transaction.',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.body.text',
              code: 'POLICY_VIOLATION_SENSITIVE_DATA',
              message: expect.stringContaining('CVV'),
            }),
          ]),
        );
      });

      it('should detect SSN requests', async () => {
        const template = {
          name: 'test_template',
          category: 'UTILITY',
          components: {
            body: {
              text: 'Please provide your social security number for verification.',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.body.text',
              code: 'POLICY_VIOLATION_SENSITIVE_DATA',
              message: expect.stringContaining('social security'),
            }),
          ]),
        );
      });

      it('should detect password requests', async () => {
        const template = {
          name: 'test_template',
          category: 'UTILITY',
          components: {
            body: {
              text: 'Reply with your password to reset your account.',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.body.text',
              code: 'POLICY_VIOLATION_SENSITIVE_DATA',
              message: expect.stringContaining('password'),
            }),
          ]),
        );
      });

      it('should detect PIN requests', async () => {
        const template = {
          name: 'test_template',
          category: 'UTILITY',
          components: {
            body: {
              text: 'Enter your PIN to confirm the transaction.',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.body.text',
              code: 'POLICY_VIOLATION_SENSITIVE_DATA',
              message: expect.stringContaining('PIN'),
            }),
          ]),
        );
      });

      it('should detect sensitive data in header text', async () => {
        const template = {
          name: 'test_template',
          category: 'UTILITY',
          components: {
            header: {
              type: 'TEXT',
              text: 'Credit Card Verification Required',
            },
            body: {
              text: 'Please complete the verification process.',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.header.text',
              code: 'POLICY_VIOLATION_SENSITIVE_DATA',
            }),
          ]),
        );
      });

      it('should detect sensitive data in footer text', async () => {
        const template = {
          name: 'test_template',
          category: 'UTILITY',
          components: {
            body: {
              text: 'Thank you for your order.',
            },
            footer: {
              text: 'Reply with your password to confirm',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.footer.text',
              code: 'POLICY_VIOLATION_SENSITIVE_DATA',
            }),
          ]),
        );
      });

      it('should detect sensitive data in button text', async () => {
        const template = {
          name: 'test_template',
          category: 'UTILITY',
          components: {
            body: {
              text: 'Complete your verification.',
            },
            buttons: [
              {
                type: 'QUICK_REPLY',
                text: 'Send my password',
              },
            ],
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.buttons[0].text',
              code: 'POLICY_VIOLATION_SENSITIVE_DATA',
            }),
          ]),
        );
      });
    });

    describe('Spam Language Detection', () => {
      it('should detect "buy now" spam language', async () => {
        const template = {
          name: 'test_template',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Buy now and get 50% off on all products!',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.body.text',
              code: 'POLICY_VIOLATION_SPAM_LANGUAGE',
              message: expect.stringContaining('buy now'),
            }),
          ]),
        );
      });

      it('should detect "limited time" spam language', async () => {
        const template = {
          name: 'test_template',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Limited time offer! Get your discount today.',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.body.text',
              code: 'POLICY_VIOLATION_SPAM_LANGUAGE',
              message: expect.stringContaining('limited time'),
            }),
          ]),
        );
      });

      it('should detect "act fast" spam language', async () => {
        const template = {
          name: 'test_template',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Act fast before this deal expires!',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.body.text',
              code: 'POLICY_VIOLATION_SPAM_LANGUAGE',
              message: expect.stringContaining('act fast'),
            }),
          ]),
        );
      });

      it('should detect "click here" spam language', async () => {
        const template = {
          name: 'test_template',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Click here to claim your prize now!',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.body.text',
              code: 'POLICY_VIOLATION_SPAM_LANGUAGE',
              message: expect.stringContaining('click here'),
            }),
          ]),
        );
      });

      it('should detect multiple spam phrases', async () => {
        const template = {
          name: 'test_template',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Urgent! Limited time offer. Act now or miss out!',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        
        // Should detect multiple violations
        const spamErrors = result.errors.filter(
          (e) => e.code === 'POLICY_VIOLATION_SPAM_LANGUAGE',
        );
        expect(spamErrors.length).toBeGreaterThan(1);
      });

      it('should detect spam language in header', async () => {
        const template = {
          name: 'test_template',
          category: 'MARKETING',
          components: {
            header: {
              type: 'TEXT',
              text: 'Urgent: Act Now!',
            },
            body: {
              text: 'Special offer for you.',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'components.header.text',
              code: 'POLICY_VIOLATION_SPAM_LANGUAGE',
            }),
          ]),
        );
      });
    });

    describe('Multiple Violations', () => {
      it('should detect both sensitive data and spam language', async () => {
        const template = {
          name: 'test_template',
          category: 'MARKETING',
          components: {
            body: {
              text: 'Buy now! Enter your credit card to get started.',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        
        // Should have both types of violations
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'POLICY_VIOLATION_SENSITIVE_DATA',
            }),
            expect.objectContaining({
              code: 'POLICY_VIOLATION_SPAM_LANGUAGE',
            }),
          ]),
        );
      });

      it('should detect violations across multiple components', async () => {
        const template = {
          name: 'test_template',
          category: 'MARKETING',
          components: {
            header: {
              type: 'TEXT',
              text: 'Limited Time Offer',
            },
            body: {
              text: 'Enter your password to unlock exclusive deals.',
            },
            footer: {
              text: 'Act fast!',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        
        // Should detect violations in multiple fields
        const violatedFields = result.errors.map((e) => e.field);
        expect(violatedFields).toContain('components.header.text');
        expect(violatedFields).toContain('components.body.text');
        expect(violatedFields).toContain('components.footer.text');
      });
    });

    describe('Valid Templates (No Violations)', () => {
      it('should pass template with no policy violations', async () => {
        const template = {
          name: 'order_confirmation',
          category: 'TRANSACTIONAL',
          components: {
            body: {
              text: 'Your order has been confirmed. Thank you for shopping with us!',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        const policyErrors = result.errors.filter(
          (e) =>
            e.code === 'POLICY_VIOLATION_SENSITIVE_DATA' ||
            e.code === 'POLICY_VIOLATION_SPAM_LANGUAGE',
        );
        expect(policyErrors).toHaveLength(0);
      });

      it('should allow legitimate use of similar words', async () => {
        const template = {
          name: 'appointment_reminder',
          category: 'UTILITY',
          components: {
            body: {
              text: 'Your appointment is confirmed. Please arrive 10 minutes early.',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        const policyErrors = result.errors.filter(
          (e) =>
            e.code === 'POLICY_VIOLATION_SENSITIVE_DATA' ||
            e.code === 'POLICY_VIOLATION_SPAM_LANGUAGE',
        );
        expect(policyErrors).toHaveLength(0);
      });
    });

    describe('Case Insensitivity', () => {
      it('should detect violations regardless of case', async () => {
        const template = {
          name: 'test_template',
          category: 'UTILITY',
          components: {
            body: {
              text: 'Please provide your CREDIT CARD number.',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'POLICY_VIOLATION_SENSITIVE_DATA',
            }),
          ]),
        );
      });

      it('should detect spam language in mixed case', async () => {
        const template = {
          name: 'test_template',
          category: 'MARKETING',
          components: {
            body: {
              text: 'BUY NOW and save big!',
            },
          },
        };

        const result = await validationEngine.validate(template);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'POLICY_VIOLATION_SPAM_LANGUAGE',
            }),
          ]),
        );
      });
    });
  });

  describe('Configurable Policy Rules', () => {
    it('should allow setting custom policy rules', () => {
      const customRules = {
        sensitiveDataPatterns: [
          { pattern: /custom\s*sensitive/i, name: 'custom sensitive data' },
        ],
        spamLanguagePatterns: [
          { pattern: /custom\s*spam/i, name: 'custom spam' },
        ],
      };

      validationEngine.setPolicyRules(customRules);
      const rules = validationEngine.getPolicyRules();

      expect(rules.sensitiveDataPatterns).toEqual(customRules.sensitiveDataPatterns);
      expect(rules.spamLanguagePatterns).toEqual(customRules.spamLanguagePatterns);
    });

    it('should use custom rules for validation', async () => {
      validationEngine.setPolicyRules({
        sensitiveDataPatterns: [
          { pattern: /secret\s*code/i, name: 'secret code' },
        ],
        spamLanguagePatterns: [
          { pattern: /super\s*deal/i, name: 'super deal' },
        ],
      });

      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Enter your secret code to get this super deal!',
          },
        },
      };

      const result = await validationEngine.validate(template);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'POLICY_VIOLATION_SENSITIVE_DATA',
            message: expect.stringContaining('secret code'),
          }),
          expect.objectContaining({
            code: 'POLICY_VIOLATION_SPAM_LANGUAGE',
            message: expect.stringContaining('super deal'),
          }),
        ]),
      );
    });

    it('should merge custom rules with defaults when using partial rules', async () => {
      // Set only spam patterns, sensitive data should still use defaults
      validationEngine.setPolicyRules({
        spamLanguagePatterns: [
          { pattern: /custom\s*spam/i, name: 'custom spam' },
        ],
      });

      const template = {
        name: 'test_template',
        category: 'UTILITY',
        components: {
          body: {
            text: 'Enter your password for custom spam offer!',
          },
        },
      };

      const result = await validationEngine.validate(template);
      
      expect(result.isValid).toBe(false);
      
      // Should still detect password (default sensitive data pattern)
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'POLICY_VIOLATION_SENSITIVE_DATA',
            message: expect.stringContaining('password'),
          }),
        ]),
      );
    });
  });

  describe('Default Policy Rules', () => {
    it('should have comprehensive sensitive data patterns', () => {
      expect(DEFAULT_POLICY_RULES.sensitiveDataPatterns.length).toBeGreaterThan(5);
      
      const patternNames = DEFAULT_POLICY_RULES.sensitiveDataPatterns.map((p) => p.name);
      expect(patternNames).toContain('credit card');
      expect(patternNames).toContain('CVV');
      expect(patternNames).toContain('SSN');
      expect(patternNames).toContain('password');
      expect(patternNames).toContain('PIN');
    });

    it('should have comprehensive spam language patterns', () => {
      expect(DEFAULT_POLICY_RULES.spamLanguagePatterns.length).toBeGreaterThan(5);
      
      const patternNames = DEFAULT_POLICY_RULES.spamLanguagePatterns.map((p) => p.name);
      expect(patternNames).toContain('buy now');
      expect(patternNames).toContain('limited time');
      expect(patternNames).toContain('act fast');
      expect(patternNames).toContain('click here');
    });
  });
});

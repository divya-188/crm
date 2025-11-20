/**
 * Placeholder Validation Examples
 * 
 * This file demonstrates the placeholder validation rules implemented in Task 3
 */

import { TemplateValidationEngine } from '../template-validation.engine';

const engine = new TemplateValidationEngine(null);

// ✅ VALID EXAMPLES
console.log('=== VALID PLACEHOLDER EXAMPLES ===\n');

const validExamples = [
  {
    name: 'Sequential placeholders',
    text: 'Hello {{1}}, your order {{2}} is ready',
  },
  {
    name: 'Single placeholder',
    text: 'Hello {{1}}, welcome to our service',
  },
  {
    name: 'Multiple placeholders with separators',
    text: 'Order {{1}} for {{2}} will arrive on {{3}}',
  },
  {
    name: 'Placeholders in middle of text',
    text: 'Your order {{1}} has been confirmed',
  },
];

validExamples.forEach(example => {
  const errors = engine.validatePlaceholders({ body: { text: example.text } });
  console.log(`${example.name}:`);
  console.log(`  Text: "${example.text}"`);
  console.log(`  Status: ${errors.length === 0 ? '✅ VALID' : '❌ INVALID'}`);
  if (errors.length > 0) {
    console.log(`  Errors:`, errors.map(e => e.code));
  }
  console.log();
});

// ❌ INVALID EXAMPLES
console.log('\n=== INVALID PLACEHOLDER EXAMPLES ===\n');

const invalidExamples = [
  {
    name: 'Single brace format',
    text: 'Hello {1}, your order is ready',
    expectedError: 'INVALID_PLACEHOLDER_FORMAT',
  },
  {
    name: 'Empty placeholder',
    text: 'Hello {{}}, your order is ready',
    expectedError: 'EMPTY_PLACEHOLDER',
  },
  {
    name: 'Named placeholder',
    text: 'Hello {{name}}, your order is ready',
    expectedError: 'NAMED_PLACEHOLDER',
  },
  {
    name: 'Format specifier',
    text: 'Hello %s, your order is ready',
    expectedError: 'FORMAT_SPECIFIER',
  },
  {
    name: 'Stacked placeholders',
    text: 'Hello {{1}}{{2}}, your order is ready',
    expectedError: 'STACKED_PLACEHOLDERS',
  },
  {
    name: 'Leading placeholder',
    text: '{{1}} is your order number',
    expectedError: 'LEADING_PLACEHOLDER',
  },
  {
    name: 'Trailing placeholder',
    text: 'Your order number is {{1}}',
    expectedError: 'TRAILING_PLACEHOLDER',
  },
  {
    name: 'Non-sequential placeholders',
    text: 'Hello {{1}}, your order {{3}} is ready',
    expectedError: 'NON_SEQUENTIAL_PLACEHOLDERS',
  },
  {
    name: 'Placeholders not starting from 1',
    text: 'Hello {{2}}, your order {{3}} is ready',
    expectedError: 'NON_SEQUENTIAL_PLACEHOLDERS',
  },
];

invalidExamples.forEach(example => {
  const errors = engine.validatePlaceholders({ body: { text: example.text } });
  console.log(`${example.name}:`);
  console.log(`  Text: "${example.text}"`);
  console.log(`  Status: ${errors.length > 0 ? '❌ INVALID' : '✅ VALID (unexpected)'}`);
  console.log(`  Expected Error: ${example.expectedError}`);
  console.log(`  Actual Errors: ${errors.map(e => e.code).join(', ')}`);
  console.log(`  Match: ${errors.some(e => e.code === example.expectedError) ? '✅' : '❌'}`);
  console.log();
});

// PLACEHOLDER EXTRACTION EXAMPLES
console.log('\n=== PLACEHOLDER EXTRACTION EXAMPLES ===\n');

const extractionExamples = [
  'Hello {{1}}, your order {{2}} is ready',
  'Order {{1}} for {{2}} will arrive on {{3}}',
  'Hello, your order is ready',
  'Hello {{1}}, order {{1}} is ready',
];

extractionExamples.forEach(text => {
  const placeholders = engine.extractPlaceholders(text);
  console.log(`Text: "${text}"`);
  console.log(`Extracted: [${placeholders.join(', ')}]`);
  console.log();
});

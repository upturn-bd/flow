/**
 * Simple tests for formula evaluation
 * Run with: npx tsx src/lib/utils/__tests__/formula-evaluator.test.ts
 */

import {
  calculateFieldValue,
  formatCalculatedValue,
} from '../formula-evaluator';

// Test data
const mockStepData = [
  {
    step_order: 1,
    data: {
      price: 100,
      quantity: 5,
    },
  },
  {
    step_order: 2,
    data: {
      discount: 10,
      tax_rate: 0.15,
    },
  },
];

console.log('Testing Formula Evaluator...\n');

// Test 1: Simple multiplication
console.log('Test 1: Simple multiplication');
const result1 = calculateFieldValue('[Step1.price] * [Step1.quantity]', mockStepData);
console.log('Formula: [Step1.price] * [Step1.quantity]');
console.log('Expected: 500');
console.log('Result:', result1);
console.log('Pass:', result1.value === 500 && !result1.error);
console.log('');

// Test 2: Complex calculation
console.log('Test 2: Complex calculation with parentheses');
const result2 = calculateFieldValue(
  '([Step1.price] * [Step1.quantity]) - [Step2.discount]',
  mockStepData
);
console.log('Formula: ([Step1.price] * [Step1.quantity]) - [Step2.discount]');
console.log('Expected: 490');
console.log('Result:', result2);
console.log('Pass:', result2.value === 490 && !result2.error);
console.log('');

// Test 3: Tax calculation
console.log('Test 3: Tax calculation');
const result3 = calculateFieldValue(
  '([Step1.price] * [Step1.quantity]) * (1 + [Step2.tax_rate])',
  mockStepData
);
console.log('Formula: ([Step1.price] * [Step1.quantity]) * (1 + [Step2.tax_rate])');
console.log('Expected: 575');
console.log('Result:', result3);
console.log('Pass:', result3.value === 575 && !result3.error);
console.log('');

// Test 4: Missing reference
console.log('Test 4: Missing reference handling');
const result4 = calculateFieldValue('[Step3.missing_field]', mockStepData);
console.log('Formula: [Step3.missing_field]');
console.log('Expected: 0 (with missing refs warning)');
console.log('Result:', result4);
console.log('Pass:', result4.value === 0 && result4.missingRefs && result4.missingRefs.length > 0);
console.log('');

// Test 5: Division
console.log('Test 5: Division');
const result5 = calculateFieldValue('[Step1.price] / [Step1.quantity]', mockStepData);
console.log('Formula: [Step1.price] / [Step1.quantity]');
console.log('Expected: 20');
console.log('Result:', result5);
console.log('Pass:', result5.value === 20 && !result5.error);
console.log('');

// Test 6: Format calculated value
console.log('Test 6: Format calculated value');
const formatted = formatCalculatedValue(123.456789, 2);
console.log('Value: 123.456789, Decimals: 2');
console.log('Expected: "123.46"');
console.log('Result:', formatted);
console.log('Pass:', formatted === '123.46');
console.log('');

// Test 7: Invalid formula
console.log('Test 7: Invalid formula handling');
const result7 = calculateFieldValue('', mockStepData);
console.log('Formula: (empty)');
console.log('Expected: error');
console.log('Result:', result7);
console.log('Pass:', result7.value === null && result7.error);
console.log('');

console.log('All tests completed!');

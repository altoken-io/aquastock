import { describe, expect, it } from 'vitest';

import { amountForParsing, sanitizeAmountInput } from './amount-input';

describe('sanitizeAmountInput', () => {
  it('keeps plain decimals as typed, including a point still being typed', () => {
    expect(sanitizeAmountInput('25')).toBe('25');
    expect(sanitizeAmountInput('25.5')).toBe('25.5');
    expect(sanitizeAmountInput('25.')).toBe('25.');
    expect(sanitizeAmountInput('')).toBe('');
  });

  it('reads a lone comma as the decimal mark', () => {
    expect(sanitizeAmountInput('25,5')).toBe('25.5');
    expect(sanitizeAmountInput('1,234,5')).toBe('1234.5');
  });

  it('treats commas next to a point as grouping', () => {
    expect(sanitizeAmountInput('1,234.5')).toBe('1234.5');
    expect(sanitizeAmountInput('1,000,000.25')).toBe('1000000.25');
  });

  it('drops everything that is not part of a number', () => {
    expect(sanitizeAmountInput('abc')).toBe('');
    expect(sanitizeAmountInput('$ 12 SPYx')).toBe('12');
    expect(sanitizeAmountInput('-5')).toBe('5');
    expect(sanitizeAmountInput('1e9')).toBe('19');
    expect(sanitizeAmountInput('１２')).toBe('');
  });

  it('keeps only the first point and fixes a leading one', () => {
    expect(sanitizeAmountInput('1.2.3')).toBe('1.23');
    expect(sanitizeAmountInput('.5')).toBe('0.5');
    expect(sanitizeAmountInput(',5')).toBe('0.5');
  });

  it('bounds the length of a pasted value', () => {
    expect(sanitizeAmountInput('9'.repeat(200))).toHaveLength(32);
  });
});

describe('amountForParsing', () => {
  it('ignores an unfinished trailing point only', () => {
    expect(amountForParsing('5.')).toBe('5');
    expect(amountForParsing('5.5')).toBe('5.5');
    expect(amountForParsing('')).toBe('');
  });
});

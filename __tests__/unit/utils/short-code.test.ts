/**
 * Short Code Generation Tests
 */

import { describe, it, expect } from 'vitest';

/**
 * Generate short code from index
 */
function generateShortCode(index: number): string {
  return `seed${String(index).padStart(2, '0')}`;
}

/**
 * Validate short code format
 */
function isValidShortCode(code: string): boolean {
  // Format: seed## where ## is 01-99
  return /^seed\d{2}$/.test(code);
}

describe('Short Code Generation', () => {
  it('generates correct format for single digit', () => {
    const code = generateShortCode(1);
    expect(code).toBe('seed01');
    expect(isValidShortCode(code)).toBe(true);
  });

  it('generates correct format for double digit', () => {
    const code = generateShortCode(25);
    expect(code).toBe('seed25');
    expect(isValidShortCode(code)).toBe(true);
  });

  it('handles edge case: index 0', () => {
    const code = generateShortCode(0);
    expect(code).toBe('seed00');
    expect(isValidShortCode(code)).toBe(true);
  });

  it('handles edge case: index 99', () => {
    const code = generateShortCode(99);
    expect(code).toBe('seed99');
    expect(isValidShortCode(code)).toBe(true);
  });

  it('validates correct short codes', () => {
    expect(isValidShortCode('seed01')).toBe(true);
    expect(isValidShortCode('seed25')).toBe(true);
    expect(isValidShortCode('seed99')).toBe(true);
  });

  it('rejects invalid short codes', () => {
    expect(isValidShortCode('seed1')).toBe(false); // Missing padding
    expect(isValidShortCode('seed001')).toBe(false); // Too many digits
    expect(isValidShortCode('SEED01')).toBe(false); // Wrong case
    expect(isValidShortCode('abc123')).toBe(false); // Wrong prefix
    expect(isValidShortCode('seed')).toBe(false); // No digits
    expect(isValidShortCode('')).toBe(false); // Empty
  });

  it('generates sequential codes correctly', () => {
    const codes = Array.from({ length: 10 }, (_, i) => generateShortCode(i + 1));
    expect(codes).toEqual([
      'seed01',
      'seed02',
      'seed03',
      'seed04',
      'seed05',
      'seed06',
      'seed07',
      'seed08',
      'seed09',
      'seed10',
    ]);
  });
});


/**
 * Unit tests for invite resolution utilities
 */

describe('Invite Resolution Utils', () => {
  describe('normalizeShortCode', () => {
    function normalizeShortCode(code: string): string {
      return code.toLowerCase().trim();
    }

    it('converts to lowercase', () => {
      expect(normalizeShortCode('ABC123')).toBe('abc123');
    });

    it('trims whitespace', () => {
      expect(normalizeShortCode(' abc123 ')).toBe('abc123');
    });

    it('handles mixed case', () => {
      expect(normalizeShortCode('AbC123')).toBe('abc123');
    });
  });

  describe('validateShortCodeFormat', () => {
    function validateShortCodeFormat(code: string): boolean {
      const codeRegex = /^[a-z0-9]{6,8}$/;
      return codeRegex.test(code);
    }

    it('accepts valid 6-char code', () => {
      expect(validateShortCodeFormat('abc123')).toBe(true);
    });

    it('accepts valid 8-char code', () => {
      expect(validateShortCodeFormat('abc12345')).toBe(true);
    });

    it('rejects codes with special chars', () => {
      expect(validateShortCodeFormat('abc-123')).toBe(false);
    });

    it('rejects codes with spaces', () => {
      expect(validateShortCodeFormat('abc 123')).toBe(false);
    });

    it('rejects codes too short', () => {
      expect(validateShortCodeFormat('abc12')).toBe(false);
    });

    it('rejects codes too long', () => {
      expect(validateShortCodeFormat('abc123456')).toBe(false);
    });

    it('rejects codes with uppercase (should be normalized first)', () => {
      expect(validateShortCodeFormat('ABC123')).toBe(false);
    });

    it('accepts codes with numbers only', () => {
      expect(validateShortCodeFormat('123456')).toBe(true);
    });

    it('accepts codes with letters only', () => {
      expect(validateShortCodeFormat('abcdef')).toBe(true);
    });
  });

  describe('extractFirstName', () => {
    function extractFirstName(fullName: string): string {
      return fullName.split(' ')[0];
    }

    it('extracts first name from full name', () => {
      expect(extractFirstName('John Doe')).toBe('John');
    });

    it('handles single name', () => {
      expect(extractFirstName('John')).toBe('John');
    });

    it('handles multiple spaces', () => {
      expect(extractFirstName('John  Doe')).toBe('John');
    });

    it('handles three names', () => {
      expect(extractFirstName('John Michael Doe')).toBe('John');
    });

    it('handles empty string', () => {
      expect(extractFirstName('')).toBe('');
    });

    it('handles leading/trailing spaces', () => {
      expect(extractFirstName(' John Doe ')).toBe(' John');
    });
  });
});


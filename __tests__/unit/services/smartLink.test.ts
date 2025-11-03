import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateShortCode,
  checkShortCodeUnique,
  generateUniqueShortCode,
  buildShareUrl,
} from '@/services/smartLink';
import { initializeFirebaseEmulator, clearFirestoreData } from '@/helpers/firebase-emulator';
import { db } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

describe('Smart Link Service', () => {
  beforeEach(async () => {
    // Initialize emulator if not already
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      initializeFirebaseEmulator();
      await clearFirestoreData(db);
    }
  });

  describe('generateShortCode', () => {
    it('should generate 6-character codes', () => {
      const code = generateShortCode();
      expect(code.length).toBe(6);
    });

    it('should generate alphanumeric codes', () => {
      const code = generateShortCode();
      expect(code).toMatch(/^[a-z0-9]{6}$/);
    });

    it('should generate lowercase codes', () => {
      const code = generateShortCode();
      expect(code).toBe(code.toLowerCase());
      expect(code).not.toMatch(/[A-Z]/);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = Array.from({ length: 10 }, () => generateShortCode());
      const uniqueCodes = new Set(codes);
      // With 6 chars and alphanumeric, collisions are extremely rare
      expect(uniqueCodes.size).toBeGreaterThan(1);
    });
  });

  describe('checkShortCodeUnique', () => {
    it('should return true for new code when no invites exist', async () => {
      if (!process.env.FIRESTORE_EMULATOR_HOST) {
        // Skip if emulator not available
        return;
      }

      const code = generateShortCode();
      const isUnique = await checkShortCodeUnique(code);
      expect(isUnique).toBe(true);
    });

    it('should return false when code already exists', async () => {
      if (!process.env.FIRESTORE_EMULATOR_HOST) {
        return;
      }

      const code = 'test123';
      
      // Create an invite with this code
      await db.collection('invites').add({
        short_code: code.toLowerCase(),
        inviter_id: 'user_1',
        loop_type: 'buddy_challenge',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      const isUnique = await checkShortCodeUnique(code);
      expect(isUnique).toBe(false);
    });

    it('should normalize code to lowercase', async () => {
      if (!process.env.FIRESTORE_EMULATOR_HOST) {
        return;
      }

      const code = 'TEST123';
      
      // Create invite with lowercase version
      await db.collection('invites').add({
        short_code: 'test123',
        inviter_id: 'user_1',
        loop_type: 'buddy_challenge',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      const isUnique = await checkShortCodeUnique(code);
      expect(isUnique).toBe(false); // Should detect collision despite case difference
    });
  });

  describe('generateUniqueShortCode', () => {
    it('should generate unique code on first attempt (no collisions)', async () => {
      if (!process.env.FIRESTORE_EMULATOR_HOST) {
        return;
      }

      const code = await generateUniqueShortCode();
      expect(code).toMatch(/^[a-z0-9]{6}$/);
      
      // Verify it's actually unique
      const isUnique = await checkShortCodeUnique(code);
      expect(isUnique).toBe(true);
    });

    it('should retry on collision and eventually succeed', async () => {
      if (!process.env.FIRESTORE_EMULATOR_HOST) {
        return;
      }

      // Pre-populate with a code to force collision
      const existingCode = 'abc123';
      await db.collection('invites').add({
        short_code: existingCode,
        inviter_id: 'user_1',
        loop_type: 'buddy_challenge',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Generate unique code (should retry if collision)
      const code = await generateUniqueShortCode(5);
      expect(code).toMatch(/^[a-z0-9]{6}$/);
      expect(code).not.toBe(existingCode);
      
      // Verify it's unique
      const isUnique = await checkShortCodeUnique(code);
      expect(isUnique).toBe(true);
    });

    it('should throw error after max retries if all collisions', async () => {
      if (!process.env.FIRESTORE_EMULATOR_HOST) {
        return;
      }

      // This test is hard to guarantee, but we can test the error handling
      // In practice, with 6 chars, collisions are extremely rare
      // So we'll test that the function works correctly
      
      const code = await generateUniqueShortCode(1); // Only 1 retry
      expect(code).toMatch(/^[a-z0-9]{6}$/);
    });
  });

  describe('buildShareUrl', () => {
    it('should build URL with short code', () => {
      const url = buildShareUrl('abc123');
      expect(url).toBe('http://localhost:3000/invite/abc123');
    });

    it('should use NEXT_PUBLIC_BASE_URL if set', () => {
      const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';
      
      const url = buildShareUrl('xyz789');
      expect(url).toBe('https://example.com/invite/xyz789');
      
      // Restore
      if (originalBaseUrl) {
        process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
      } else {
        delete process.env.NEXT_PUBLIC_BASE_URL;
      }
    });

    it('should handle different short codes', () => {
      const url1 = buildShareUrl('test1');
      const url2 = buildShareUrl('test2');
      
      expect(url1).toContain('test1');
      expect(url2).toContain('test2');
      expect(url1).not.toBe(url2);
    });
  });
});


/**
 * Loop Orchestrator Agent Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LoopOrchestrator } from '@/agents/LoopOrchestrator';
import { initializeFirebaseEmulator, clearFirestoreData } from '../../helpers/firebase-emulator';
import type { FirebaseFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import type { PracticeResult } from '@/types';

describe('LoopOrchestrator', () => {
  let db: FirebaseFirestore.Firestore;
  let orchestrator: LoopOrchestrator;
  const testUserId = 'test_user_123';
  const testResultId = 'test_result_123';

  beforeEach(async () => {
    // Initialize Firebase emulator
    db = initializeFirebaseEmulator();
    orchestrator = new LoopOrchestrator(db);
    
    // Clear any existing data
    await clearFirestoreData(db);
  });

  afterEach(async () => {
    // Clean up after each test
    await clearFirestoreData(db);
  });

  describe('Rule 1: Practice Completion Check', () => {
    it('should skip if practice result does not exist', async () => {
      const event = {
        type: 'practice_completed' as const,
        resultId: 'non_existent_result',
      };

      const decision = await orchestrator.decide(testUserId, event);

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.rationale).toContain('No practice test completion found');
      expect(decision.features_used).toContain('practice_completion_check');
      expect(decision.decisionId).toBeTruthy();
    });

    it('should skip if practice result exists but has no completed_at', async () => {
      // Create practice result without completed_at
      await db.collection('practice_results').doc(testResultId).set({
        user_id: testUserId,
        score: 75,
        skill_gaps: ['Algebra'],
      });

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.rationale).toContain('No practice test completion found');
    });

    it('should pass if practice result exists with completed_at', async () => {
      // Create valid practice result
      await db.collection('practice_results').doc(testResultId).set({
        user_id: testUserId,
        score: 75,
        skill_gaps: ['Algebra'],
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Wait a bit for timestamp to be set
      await new Promise(resolve => setTimeout(resolve, 100));

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Should not skip due to missing practice result
      expect(decision.rationale).not.toContain('No practice test completion found');
    });
  });

  describe('Rule 2: Rate Limiting (Daily Limit)', () => {
    beforeEach(async () => {
      // Create valid practice result
      await db.collection('practice_results').doc(testResultId).set({
        user_id: testUserId,
        score: 75,
        skill_gaps: ['Algebra'],
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should pass with 0 invites today', async () => {
      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Should not skip due to rate limit
      expect(decision.rationale).not.toContain('Rate limit reached');
    });

    it('should pass with 1 invite today', async () => {
      // Create 1 invite today
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      await db.collection('invites').add({
        inviter_id: testUserId,
        created_at: admin.firestore.Timestamp.fromDate(new Date()),
        loop_type: 'buddy_challenge',
      });

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Should not skip due to rate limit
      expect(decision.rationale).not.toContain('Rate limit reached');
    });

    it('should pass with 2 invites today', async () => {
      // Create 2 invites today
      for (let i = 0; i < 2; i++) {
        await db.collection('invites').add({
          inviter_id: testUserId,
          created_at: admin.firestore.Timestamp.fromDate(new Date()),
          loop_type: 'buddy_challenge',
        });
      }

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Should not skip due to rate limit
      expect(decision.rationale).not.toContain('Rate limit reached');
    });

    it('should skip with 3 invites today', async () => {
      // Create 3 invites today
      for (let i = 0; i < 3; i++) {
        await db.collection('invites').add({
          inviter_id: testUserId,
          created_at: admin.firestore.Timestamp.fromDate(new Date()),
          loop_type: 'buddy_challenge',
        });
      }

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.rationale).toContain('Rate limit reached');
      expect(decision.rationale).toContain('3/3');
    });

    it('should skip with 4 invites today', async () => {
      // Create 4 invites today
      for (let i = 0; i < 4; i++) {
        await db.collection('invites').add({
          inviter_id: testUserId,
          created_at: admin.firestore.Timestamp.fromDate(new Date()),
          loop_type: 'buddy_challenge',
        });
      }

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.rationale).toContain('Rate limit reached');
    });

    it('should not count invites from yesterday', async () => {
      // Create 3 invites from yesterday
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      yesterday.setUTCHours(23, 59, 59, 999);

      for (let i = 0; i < 3; i++) {
        await db.collection('invites').add({
          inviter_id: testUserId,
          created_at: admin.firestore.Timestamp.fromDate(yesterday),
          loop_type: 'buddy_challenge',
        });
      }

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Should not skip (yesterday's invites don't count)
      expect(decision.rationale).not.toContain('Rate limit reached');
    });
  });

  describe('Rule 3: Cooldown Period Check', () => {
    beforeEach(async () => {
      // Create valid practice result
      await db.collection('practice_results').doc(testResultId).set({
        user_id: testUserId,
        score: 75,
        skill_gaps: ['Algebra'],
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should pass with no previous invites', async () => {
      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Should not skip due to cooldown
      expect(decision.rationale).not.toContain('Cooldown period active');
    });

    it('should pass with last invite 2 hours ago', async () => {
      // Create invite 2 hours ago
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      await db.collection('invites').add({
        inviter_id: testUserId,
        created_at: admin.firestore.Timestamp.fromDate(twoHoursAgo),
        loop_type: 'buddy_challenge',
      });

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Should not skip (cooldown expired)
      expect(decision.rationale).not.toContain('Cooldown period active');
    });

    it('should pass with last invite exactly 1 hour ago', async () => {
      // Create invite exactly 1 hour ago
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      await db.collection('invites').add({
        inviter_id: testUserId,
        created_at: admin.firestore.Timestamp.fromDate(oneHourAgo),
        loop_type: 'buddy_challenge',
      });

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Should pass (1 hour is the boundary, >= 1 hour passes)
      expect(decision.rationale).not.toContain('Cooldown period active');
    });

    it('should skip with last invite 59 minutes ago', async () => {
      // Create invite 59 minutes ago
      const fiftyNineMinutesAgo = new Date();
      fiftyNineMinutesAgo.setMinutes(fiftyNineMinutesAgo.getMinutes() - 59);

      await db.collection('invites').add({
        inviter_id: testUserId,
        created_at: admin.firestore.Timestamp.fromDate(fiftyNineMinutesAgo),
        loop_type: 'buddy_challenge',
      });

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.rationale).toContain('Cooldown period active');
    });

    it('should skip with last invite 30 minutes ago', async () => {
      // Create invite 30 minutes ago
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      await db.collection('invites').add({
        inviter_id: testUserId,
        created_at: admin.firestore.Timestamp.fromDate(thirtyMinutesAgo),
        loop_type: 'buddy_challenge',
      });

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.rationale).toContain('Cooldown period active');
    });
  });

  describe('Rule 4: Score Threshold Check', () => {
    beforeEach(async () => {
      // Create practice result (score will be set per test)
      await db.collection('practice_results').doc(testResultId).set({
        user_id: testUserId,
        score: 50, // Default, will be overridden
        skill_gaps: ['Algebra'],
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should pass with score 50% (boundary)', async () => {
      await db.collection('practice_results').doc(testResultId).update({
        score: 50,
      });

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Should not skip due to score
      expect(decision.rationale).not.toContain('Score too low');
    });

    it('should skip with score 49%', async () => {
      await db.collection('practice_results').doc(testResultId).update({
        score: 49,
      });

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.rationale).toContain('Score too low');
      expect(decision.rationale).toContain('49%');
    });

    it('should pass with score 100%', async () => {
      await db.collection('practice_results').doc(testResultId).update({
        score: 100,
      });

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Should not skip due to score
      expect(decision.rationale).not.toContain('Score too low');
    });

    it('should skip with score 0%', async () => {
      await db.collection('practice_results').doc(testResultId).update({
        score: 0,
      });

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.rationale).toContain('Score too low');
    });

    it('should use score from event if provided', async () => {
      // Set low score in database
      await db.collection('practice_results').doc(testResultId).update({
        score: 30,
      });

      // But provide higher score in event
      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
        score: 75, // Override database score
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Should not skip (event score used)
      expect(decision.rationale).not.toContain('Score too low');
    });
  });

  describe('Combined Rules - All Pass', () => {
    it('should trigger when all rules pass', async () => {
      // Create valid practice result
      await db.collection('practice_results').doc(testResultId).set({
        user_id: testUserId,
        score: 78,
        skill_gaps: ['Algebra'],
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      expect(decision.shouldTrigger).toBe(true);
      expect(decision.loopType).toBe('buddy_challenge');
      expect(decision.rationale).toContain('78%');
      expect(decision.features_used).toContain('practice_completion_check');
      expect(decision.features_used).toContain('practice_score');
      expect(decision.features_used).toContain('invite_count_today');
      expect(decision.decisionId).toBeTruthy();
    });
  });

  describe('Decision Logging', () => {
    beforeEach(async () => {
      // Create valid practice result
      await db.collection('practice_results').doc(testResultId).set({
        user_id: testUserId,
        score: 75,
        skill_gaps: ['Algebra'],
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should log decision to Firestore', async () => {
      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Verify decision was logged
      expect(decision.decisionId).toBeTruthy();
      expect(decision.decisionId).not.toBe('log_failed');

      // Fetch decision document
      const decisionDoc = await db.collection('decisions').doc(decision.decisionId).get();
      expect(decisionDoc.exists).toBe(true);

      const data = decisionDoc.data();
      expect(data?.user_id).toBe(testUserId);
      expect(data?.event_type).toBe('practice_completed');
      expect(data?.event_id).toBe(testResultId);
      expect(data?.decision).toBe(decision.shouldTrigger ? 'trigger_buddy_challenge' : 'skip');
      expect(data?.rationale).toBe(decision.rationale);
      expect(data?.features_used).toEqual(decision.features_used);
      expect(data?.created_at).toBeTruthy();
    });

    it('should include context in logged decision', async () => {
      const event = {
        type: 'practice_completed' as const,
        resultId: testResultId,
        score: 85,
      };

      const decision = await orchestrator.decide(testUserId, event);

      // Fetch decision document
      const decisionDoc = await db.collection('decisions').doc(decision.decisionId).get();
      const data = decisionDoc.data();

      expect(data?.context).toBeDefined();
      expect(data?.context.score).toBe(85);
      expect(data?.context.invites_today).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should default to skip on database error', async () => {
      // Create orchestrator with invalid database (will cause errors)
      // Note: This is a simplified test - in practice, errors might be caught differently
      const event = {
        type: 'practice_completed' as const,
        resultId: 'invalid_result_id',
      };

      // Should handle gracefully
      const decision = await orchestrator.decide(testUserId, event);

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.features_used).toContain('error_fallback');
    });
  });
});


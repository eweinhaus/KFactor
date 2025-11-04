/**
 * Integration Tests: Invite Resolution API
 * Tests the GET /api/invite/:shortCode endpoint
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '../../../../app/api/invite/[shortCode]/route';
import { NextRequest } from 'next/server';
import { initializeFirebaseEmulator, clearFirestoreData } from '../../../helpers/firebase-emulator';
import type { FirebaseFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

describe('GET /api/invite/:shortCode', () => {
  let db: FirebaseFirestore.Firestore;
  const testUserId = 'test_user_resolution';
  const testInviterId = 'test_inviter';
  const testShortCode = 'test123';

  beforeEach(async () => {
    // Initialize Firebase emulator
    db = initializeFirebaseEmulator();
    
    // Clear any existing data
    await clearFirestoreData(db);

    // Create test inviter user
    await db.collection('users').doc(testInviterId).set({
      email: 'inviter@example.com',
      name: 'John Doe',
      xp: 200,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create analytics counter
    await db.collection('analytics_counters').doc('global').set({
      total_users: 1,
      total_invites_sent: 1,
      total_invites_opened: 0,
      total_invites_accepted: 0,
      total_fvm_reached: 0,
      last_updated: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await clearFirestoreData(db);
  });

  function createRequest(shortCode: string): NextRequest {
    const url = new URL(`http://localhost:3000/api/invite/${shortCode}`);
    return new NextRequest(url, {
      method: 'GET',
    });
  }

  async function createTestInvite(shortCode: string, hasOpenedAt: boolean = false) {
    const inviteData: any = {
      short_code: shortCode.toLowerCase(),
      inviter_id: testInviterId,
      loop_type: 'buddy_challenge',
      practice_result_id: 'test_result',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      challenge_data: {
        skill: 'Algebra',
        questions: [
          { id: 'q1', text: 'Question 1', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, skill: 'Algebra' },
          { id: 'q2', text: 'Question 2', options: ['A', 'B', 'C', 'D'], correctAnswer: 1, skill: 'Algebra' },
          { id: 'q3', text: 'Question 3', options: ['A', 'B', 'C', 'D'], correctAnswer: 2, skill: 'Algebra' },
          { id: 'q4', text: 'Question 4', options: ['A', 'B', 'C', 'D'], correctAnswer: 3, skill: 'Algebra' },
          { id: 'q5', text: 'Question 5', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, skill: 'Algebra' },
        ],
        share_copy: 'I got 75% on Algebra!',
        inviter_name: 'John',
        inviter_score: 75,
      },
    };

    if (hasOpenedAt) {
      inviteData.opened_at = admin.firestore.FieldValue.serverTimestamp();
    }

    const inviteRef = db.collection('invites').doc();
    await inviteRef.set(inviteData);
    return inviteRef.id;
  }

  it('returns challenge data for valid short code', async () => {
    await createTestInvite(testShortCode);

    const request = createRequest(testShortCode);
    const response = await GET(request, { params: { shortCode: testShortCode } });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('inviteId');
    expect(data).toHaveProperty('inviter');
    expect(data).toHaveProperty('challenge');
    expect(data.inviter.name).toBe('John'); // First name only
    expect(data.challenge.questionCount).toBe(5);
    expect(data.challenge.skill).toBe('Algebra');
    expect(data.challenge.inviterScore).toBe(75);
  });

  it('returns 404 for invalid short code', async () => {
    const request = createRequest('invalid');
    const response = await GET(request, { params: { shortCode: 'invalid' } });
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('not_found');
  });

  it('returns 400 for invalid short code format', async () => {
    const request = createRequest('abc-123'); // Invalid format (has dash)
    const response = await GET(request, { params: { shortCode: 'abc-123' } });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('invalid_code');
  });

  it('logs opened_at on first visit', async () => {
    const inviteId = await createTestInvite(testShortCode);

    const request = createRequest(testShortCode);
    await GET(request, { params: { shortCode: testShortCode } });

    // Verify invite has opened_at timestamp
    const inviteDoc = await db.collection('invites').doc(inviteId).get();
    const inviteData = inviteDoc.data();
    expect(inviteData?.opened_at).toBeTruthy();
  });

  it('increments analytics counter on first visit', async () => {
    await createTestInvite(testShortCode);

    const counterBefore = await db.collection('analytics_counters').doc('global').get();
    const beforeCount = counterBefore.data()?.total_invites_opened || 0;

    const request = createRequest(testShortCode);
    await GET(request, { params: { shortCode: testShortCode } });

    const counterAfter = await db.collection('analytics_counters').doc('global').get();
    const afterCount = counterAfter.data()?.total_invites_opened || 0;

    expect(afterCount).toBe(beforeCount + 1);
  });

  it('does not double-count on second visit (idempotent)', async () => {
    await createTestInvite(testShortCode);

    const request = createRequest(testShortCode);

    // First visit
    await GET(request, { params: { shortCode: testShortCode } });
    const counterAfterFirst = await db.collection('analytics_counters').doc('global').get();
    const firstCount = counterAfterFirst.data()?.total_invites_opened || 0;

    // Second visit
    await GET(request, { params: { shortCode: testShortCode } });
    const counterAfterSecond = await db.collection('analytics_counters').doc('global').get();
    const secondCount = counterAfterSecond.data()?.total_invites_opened || 0;

    expect(secondCount).toBe(firstCount); // Counter should not increment
  });

  it('returns 500 if inviter not found', async () => {
    // Create invite with invalid inviter_id
    await db.collection('invites').add({
      short_code: testShortCode,
      inviter_id: 'invalid_user',
      loop_type: 'buddy_challenge',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      challenge_data: {
        skill: 'Algebra',
        questions: [],
        share_copy: 'Test',
        inviter_name: 'Test',
        inviter_score: 75,
      },
    });

    const request = createRequest(testShortCode);
    const response = await GET(request, { params: { shortCode: testShortCode } });
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('data_error');
  });

  it('normalizes short code to lowercase', async () => {
    // Create invite with lowercase code
    await createTestInvite('test123');

    // Request with uppercase
    const request = createRequest('TEST123');
    const response = await GET(request, { params: { shortCode: 'TEST123' } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('inviteId');
  });
});


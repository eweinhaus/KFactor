/**
 * Integration Tests: Accept Challenge API
 * Tests the POST /api/invite/:shortCode/accept endpoint
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../../../app/api/invite/[shortCode]/accept/route';
import { NextRequest } from 'next/server';
import { initializeFirebaseEmulator, clearFirestoreData } from '../../../helpers/firebase-emulator';
import type { FirebaseFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

describe('POST /api/invite/:shortCode/accept', () => {
  let db: FirebaseFirestore.Firestore;
  const testInviterId = 'test_inviter_accept';
  const testShortCode = 'accept123';
  const testInviteId = 'test_invite_accept';

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
      total_invites_opened: 1,
      total_invites_accepted: 0,
      total_fvm_reached: 0,
      last_updated: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await clearFirestoreData(db);
  });

  function createRequest(shortCode: string, body: any): NextRequest {
    const url = new URL(`http://localhost:3000/api/invite/${shortCode}/accept`);
    return new NextRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async function createTestInvite(shortCode: string, hasInviteeId: boolean = false) {
    const inviteData: any = {
      short_code: shortCode.toLowerCase(),
      inviter_id: testInviterId,
      loop_type: 'buddy_challenge',
      practice_result_id: 'test_result',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      opened_at: admin.firestore.FieldValue.serverTimestamp(),
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

    if (hasInviteeId) {
      inviteData.invitee_id = 'existing_user';
      inviteData.accepted_at = admin.firestore.FieldValue.serverTimestamp();
    }

    const inviteRef = db.collection('invites').doc(testInviteId);
    await inviteRef.set(inviteData);
    return inviteRef.id;
  }

  it('creates new user and accepts challenge', async () => {
    await createTestInvite(testShortCode);

    const request = createRequest(testShortCode, {
      name: 'New User',
      email: 'new@test.com',
    });

    const response = await POST(request, { params: { shortCode: testShortCode } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('userId');
    expect(data).toHaveProperty('challenge');
    expect(data.challenge.skill).toBe('Algebra');
    expect(data.challenge.questions.length).toBe(5);

    // Verify user created
    const userDoc = await db.collection('users').doc(data.userId).get();
    expect(userDoc.exists).toBe(true);
    const userData = userDoc.data();
    expect(userData?.name).toBe('New User');
    expect(userData?.email).toBe('new@test.com');

    // Verify invite updated
    const inviteDoc = await db.collection('invites').doc(testInviteId).get();
    const inviteData = inviteDoc.data();
    expect(inviteData?.invitee_id).toBe(data.userId);
    expect(inviteData?.accepted_at).toBeTruthy();
  });

  it('finds existing user by email', async () => {
    await createTestInvite(testShortCode);

    // Create existing user
    const existingUserId = 'existing_user';
    await db.collection('users').doc(existingUserId).set({
      name: 'Existing User',
      email: 'existing@test.com',
      xp: 100,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    const request = createRequest(testShortCode, {
      name: 'Different Name',
      email: 'existing@test.com',
    });

    const response = await POST(request, { params: { shortCode: testShortCode } });
    
    const data = await response.json();
    expect(data.userId).toBe(existingUserId);

    // Verify no duplicate user created
    const userSnapshot = await db.collection('users').where('email', '==', 'existing@test.com').get();
    expect(userSnapshot.size).toBe(1);
  });

  it('logs invitee_id and accepted_at', async () => {
    await createTestInvite(testShortCode);

    const request = createRequest(testShortCode, {
      name: 'Test User',
    });

    const response = await POST(request, { params: { shortCode: testShortCode } });
    const data = await response.json();

    const invite = await db.collection('invites').doc(testInviteId).get();
    const inviteData = invite.data();
    expect(inviteData?.invitee_id).toBe(data.userId);
    expect(inviteData?.accepted_at).toBeTruthy();
  });

  it('increments analytics counter', async () => {
    await createTestInvite(testShortCode);

    const counterBefore = await db.collection('analytics_counters').doc('global').get();
    const beforeCount = counterBefore.data()?.total_invites_accepted || 0;

    const request = createRequest(testShortCode, {
      name: 'Test User',
    });

    await POST(request, { params: { shortCode: testShortCode } });

    const counterAfter = await db.collection('analytics_counters').doc('global').get();
    const afterCount = counterAfter.data()?.total_invites_accepted || 0;

    expect(afterCount).toBe(beforeCount + 1);
  });

  it('returns 409 if already accepted', async () => {
    await createTestInvite(testShortCode, true); // Already accepted

    const request = createRequest(testShortCode, {
      name: 'Second User',
    });

    const response = await POST(request, { params: { shortCode: testShortCode } });
    
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toBe('already_accepted');
  });

  it('returns 404 for invalid short code', async () => {
    const request = createRequest('invalid', {
      name: 'Test User',
    });

    const response = await POST(request, { params: { shortCode: 'invalid' } });
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('not_found');
  });

  it('returns 400 for missing name', async () => {
    await createTestInvite(testShortCode);

    const request = createRequest(testShortCode, {
      email: 'test@test.com',
    });

    const response = await POST(request, { params: { shortCode: testShortCode } });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('bad_request');
  });

  it('returns 400 for invalid email format', async () => {
    await createTestInvite(testShortCode);

    const request = createRequest(testShortCode, {
      name: 'Test User',
      email: 'invalid-email',
    });

    const response = await POST(request, { params: { shortCode: testShortCode } });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('bad_request');
  });

  it('creates user with temp email if email not provided', async () => {
    await createTestInvite(testShortCode);

    const request = createRequest(testShortCode, {
      name: 'Test User',
    });

    const response = await POST(request, { params: { shortCode: testShortCode } });
    const data = await response.json();

    const userDoc = await db.collection('users').doc(data.userId).get();
    const userData = userDoc.data();
    expect(userData?.email).toMatch(/^user_.*@temp\.local$/);
  });
});


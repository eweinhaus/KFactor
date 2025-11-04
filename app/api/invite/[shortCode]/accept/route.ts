import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Invite, User, AcceptChallengeRequest, AcceptChallengeResponse } from '@/types';

/**
 * Creates or finds a user by email (mock auth for MVP)
 */
async function createOrFindUser(name: string, email?: string): Promise<User> {
  let user: User | null = null;

  // Try to find existing user by email (if provided)
  if (email) {
    const existingUserSnapshot = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUserSnapshot.empty) {
      const userDoc = existingUserSnapshot.docs[0];
      const userData = userDoc.data();
      user = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        xp: userData.xp,
        created_at: userData.created_at,
      };
      return user;
    }
  }

  // Create new user
  const userId = db.collection('users').doc().id;
  const userData = {
    name: name.trim(),
    email: email || `user_${userId}@temp.local`,
    xp: 0,
    created_at: FieldValue.serverTimestamp(),
  };

  await db.collection('users').doc(userId).set(userData);

  user = {
    id: userId,
    email: userData.email,
    name: userData.name,
    xp: 0,
    created_at: userData.created_at as any,
  };

  return user;
}

/**
 * POST /api/invite/[shortCode]/accept
 * Accepts challenge, creates/finds user, logs acceptance event
 * 
 * Request: { name: string, email?: string }
 * Response: { userId, inviteId, challenge, redirectUrl }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const body: AcceptChallengeRequest = await request.json();
    const { name, email } = body;

    // Validate name (required)
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate email format (if provided)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'bad_request', message: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Normalize short code
    const normalizedCode = params.shortCode.toLowerCase().trim();

    // Query invite by short code
    const inviteSnapshot = await db
      .collection('invites')
      .where('short_code', '==', normalizedCode)
      .limit(1)
      .get();

    if (inviteSnapshot.empty) {
      return NextResponse.json(
        { error: 'not_found', message: 'Challenge not found' },
        { status: 404 }
      );
    }

    const inviteDoc = inviteSnapshot.docs[0];
    const inviteData = inviteDoc.data();
    const invite: Invite = {
      id: inviteDoc.id,
      short_code: inviteData.short_code,
      inviter_id: inviteData.inviter_id,
      loop_type: inviteData.loop_type,
      practice_result_id: inviteData.practice_result_id,
      created_at: inviteData.created_at,
      opened_at: inviteData.opened_at,
      invitee_id: inviteData.invitee_id,
      accepted_at: inviteData.accepted_at,
      fvm_reached_at: inviteData.fvm_reached_at,
      challenge_data: inviteData.challenge_data,
    };

    // Check if already accepted
    if (invite.invitee_id) {
      return NextResponse.json(
        { error: 'already_accepted', message: 'This challenge has already been accepted' },
        { status: 409 }
      );
    }

    // Create or find user (mock auth)
    const user = await createOrFindUser(name, email);

    // Atomic batch write: update invite + increment analytics counter
    const batch = db.batch();

    // 1. Update invite with invitee_id and accepted_at
    const inviteRef = db.collection('invites').doc(inviteDoc.id);
    batch.update(inviteRef, {
      invitee_id: user.id,
      accepted_at: FieldValue.serverTimestamp(),
    });

    // 2. Increment analytics counter
    const analyticsRef = db.collection('analytics_counters').doc('global');
    batch.update(analyticsRef, {
      total_invites_accepted: FieldValue.increment(1),
      last_updated: FieldValue.serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error('Failed to log accepted event:', error);
      return NextResponse.json(
        { error: 'server_error', message: 'Failed to accept challenge' },
        { status: 500 }
      );
    }

    // Build response
    const response: AcceptChallengeResponse = {
      userId: user.id,
      inviteId: inviteDoc.id,
      challenge: {
        skill: invite.challenge_data.skill,
        questions: invite.challenge_data.questions,
        inviterScore: invite.challenge_data.inviter_score,
      },
      redirectUrl: `/challenge/${inviteDoc.id}`, // Phase 7
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Accept challenge error:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to accept challenge' },
      { status: 500 }
    );
  }
}


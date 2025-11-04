import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Invite, User, InviteResolutionResponse } from '@/types';

/**
 * GET /api/invite/[shortCode]
 * Resolves short code, logs "opened" event (idempotent), returns challenge preview
 * 
 * Response: { inviteId, inviter: { name }, challenge: { skill, questionCount, estimatedTime, inviterScore, shareCopy }, callToAction }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const { shortCode } = params;

    // Normalize to lowercase (case-insensitive)
    const normalizedCode = shortCode.toLowerCase().trim();

    // Validate format (6-8 alphanumeric chars)
    const codeRegex = /^[a-z0-9]{6,8}$/;
    if (!codeRegex.test(normalizedCode)) {
      return NextResponse.json(
        { error: 'invalid_code', message: 'Invalid invite code format' },
        { status: 400 }
      );
    }

    // Query invites collection by short_code
    const inviteSnapshot = await db
      .collection('invites')
      .where('short_code', '==', normalizedCode)
      .limit(1)
      .get();

    if (inviteSnapshot.empty) {
      return NextResponse.json(
        { error: 'not_found', message: 'Challenge not found or expired' },
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

    // Check if invite already opened (idempotency)
    const alreadyOpened = !!invite.opened_at;

    // Fetch inviter user data
    const inviterDoc = await db.collection('users').doc(invite.inviter_id).get();

    if (!inviterDoc.exists) {
      console.error('Inviter not found:', invite.inviter_id);
      return NextResponse.json(
        { error: 'data_error', message: 'Challenge data is incomplete' },
        { status: 500 }
      );
    }

    const inviterData = inviterDoc.data()!;
    const inviter: User = {
      id: inviterDoc.id,
      email: inviterData.email,
      name: inviterData.name,
      xp: inviterData.xp,
      created_at: inviterData.created_at,
    };

    // Extract first name only (privacy-safe)
    const inviterFirstName = inviter.name.split(' ')[0];

    // Log opened event (atomic) - only if not already opened
    if (!alreadyOpened) {
      const batch = db.batch();

      // 1. Update invite with opened_at timestamp
      const inviteRef = db.collection('invites').doc(inviteDoc.id);
      batch.update(inviteRef, {
        opened_at: FieldValue.serverTimestamp(),
      });

      // 2. Increment analytics counter
      const analyticsRef = db.collection('analytics_counters').doc('global');
      batch.update(analyticsRef, {
        total_invites_opened: FieldValue.increment(1),
        last_updated: FieldValue.serverTimestamp(),
      });

      try {
        await batch.commit();
      } catch (error) {
        console.error('Failed to log opened event:', error);
        // Don't fail the request - user can still see landing page
      }
    }

    // Build response
    return NextResponse.json({
      inviteId: inviteDoc.id,
      inviter: {
        name: inviterFirstName, // First name only
      },
      challenge: {
        skill: invite.challenge_data.skill,
        questionCount: invite.challenge_data.questions.length,
        estimatedTime: '2 min', // 5 questions ≈ 2 minutes
        inviterScore: invite.challenge_data.inviter_score,
        shareCopy: invite.challenge_data.share_copy,
      },
      callToAction: `Beat ${inviterFirstName}'s score!`,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Invite resolution error:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to load challenge' },
      { status: 500 }
    );
  }
}


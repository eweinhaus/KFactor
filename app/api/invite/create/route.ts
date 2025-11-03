import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { LoopOrchestrator } from '@/agents/LoopOrchestrator';
import { generateChallenge } from '@/services/sessionIntelligence';
import { generateUniqueShortCode, buildShareUrl } from '@/services/smartLink';
import type { Invite, InviteCreateRequest, InviteCreateResponse, PracticeResult, User } from '@/types';
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/invite/create
 * Creates a new invite with challenge data
 * 
 * Request body: { userId: string, resultId: string }
 * Response: { shortCode, shareUrl, shareCard }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: InviteCreateRequest = await request.json();
    const { userId, resultId } = body;

    // Request validation
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'bad_request', message: 'userId is required' },
        { status: 400 }
      );
    }

    if (!resultId || typeof resultId !== 'string' || resultId.trim() === '') {
      return NextResponse.json(
        { error: 'bad_request', message: 'resultId is required' },
        { status: 400 }
      );
    }

    // Fetch practice result
    const resultDoc = await db.collection('practice_results').doc(resultId).get();
    
    if (!resultDoc.exists) {
      return NextResponse.json(
        { error: 'not_found', message: 'Practice result not found' },
        { status: 404 }
      );
    }

    const resultData = resultDoc.data()!;
    const practiceResult: PracticeResult = {
      id: resultDoc.id,
      user_id: resultData.user_id,
      score: resultData.score,
      skill_gaps: resultData.skill_gaps || [],
      completed_at: resultData.completed_at,
    };

    // Validate result belongs to user
    if (practiceResult.user_id !== userId) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Practice result does not belong to user' },
        { status: 403 }
      );
    }

    // Validate result has completed_at timestamp
    if (!practiceResult.completed_at) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Practice result not completed' },
        { status: 400 }
      );
    }

    // Orchestrator decision (final eligibility check)
    const orchestrator = new LoopOrchestrator(db);
    const decision = await orchestrator.decide(userId, {
      type: 'invite_requested',
      resultId: resultId,
      score: practiceResult.score,
      skillGaps: practiceResult.skill_gaps,
    });

    // Handle orchestrator denial
    if (!decision.shouldTrigger) {
      const rationale = decision.rationale.toLowerCase();
      
      // Determine error type from rationale
      if (rationale.includes('rate limit') || rationale.includes('invites today')) {
        return NextResponse.json(
          { error: 'rate_limit_exceeded', message: 'You can only send 3 challenges per day' },
          { status: 429 }
        );
      }
      
      if (rationale.includes('cooldown') || rationale.includes('minutes ago')) {
        return NextResponse.json(
          { error: 'cooldown_period', message: 'Please wait before sending another challenge' },
          { status: 403 }
        );
      }
      
      if (rationale.includes('score too low') || rationale.includes('score') && rationale.includes('low')) {
        return NextResponse.json(
          { error: 'score_too_low', message: 'Score must be at least 50% to challenge friends' },
          { status: 400 }
        );
      }
      
      // Generic denial
      return NextResponse.json(
        { error: 'not_eligible', message: 'You are not eligible to create a challenge at this time' },
        { status: 403 }
      );
    }

    // Fetch user to get name for challenge generation
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'not_found', message: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    const user: User = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      xp: userData.xp,
      created_at: userData.created_at,
    };

    // Generate challenge (Session Intelligence)
    const challenge = generateChallenge(practiceResult, user.name);
    
    // Validate challenge payload
    if (!challenge.questions || challenge.questions.length !== 5) {
      return NextResponse.json(
        { error: 'server_error', message: 'Failed to generate challenge questions' },
        { status: 500 }
      );
    }

    // Generate smart link
    const shortCode = await generateUniqueShortCode();
    const shareUrl = buildShareUrl(shortCode);

    // Build invite document
    const inviteId = db.collection('invites').doc().id;
    const invite: Invite = {
      id: inviteId,
      short_code: shortCode.toLowerCase(), // Normalize to lowercase
      inviter_id: userId,
      loop_type: 'buddy_challenge',
      practice_result_id: resultId,
      created_at: FieldValue.serverTimestamp() as any,
      challenge_data: {
        skill: challenge.skill,
        questions: challenge.questions,
        share_copy: challenge.shareCopy,
        inviter_name: user.name.split(' ')[0], // First name only
        inviter_score: practiceResult.score,
      },
    };

    // Atomic batch write: invite creation + analytics counter increment
    const batch = db.batch();
    
    // 1. Create invite document
    const inviteRef = db.collection('invites').doc(invite.id);
    batch.set(inviteRef, invite);
    
    // 2. Increment analytics counter
    const analyticsRef = db.collection('analytics_counters').doc('global');
    batch.update(analyticsRef, {
      total_invites_sent: FieldValue.increment(1),
      last_updated: FieldValue.serverTimestamp(),
    });
    
    // Commit batch write
    await batch.commit();

    // Build response
    const response: InviteCreateResponse = {
      shortCode,
      shareUrl,
      shareCard: {
        text: challenge.shareCopy,
        inviterName: user.name.split(' ')[0], // First name only
        score: practiceResult.score,
        skill: challenge.skill,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error creating invite:', error);
    
    // Handle specific error types
    if (error.message?.includes('collision_error')) {
      return NextResponse.json(
        { error: 'server_error', message: 'Failed to generate unique invite code. Please try again.' },
        { status: 500 }
      );
    }
    
    // Generic server error
    return NextResponse.json(
      { error: 'server_error', message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}


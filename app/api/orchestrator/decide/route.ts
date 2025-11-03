import { NextRequest, NextResponse } from 'next/server';
import { LoopOrchestrator } from '@/agents/LoopOrchestrator';
import { db } from '@/lib/firebase-admin';
import type { EventContext } from '@/types';

/**
 * POST /api/orchestrator/decide
 * 
 * Orchestrator decision endpoint - makes intelligent decisions about
 * when to trigger viral loop prompts based on eligibility rules.
 * 
 * Request Body:
 * {
 *   userId: string;
 *   event: {
 *     type: "practice_completed" | "invite_requested";
 *     resultId: string;
 *     score?: number;
 *     skillGaps?: string[];
 *   }
 * }
 * 
 * Response:
 * {
 *   shouldTrigger: boolean;
 *   rationale: string;
 *   loopType?: string;
 *   features_used: string[];
 *   decisionId: string;
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    // Parse and validate request body
    const body = await request.json();
    const { userId, event } = body;

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'userId is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate event
    if (!event || typeof event !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'event is required and must be an object' },
        { status: 400 }
      );
    }

    // Validate event.type
    if (event.type !== 'practice_completed' && event.type !== 'invite_requested') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'event.type must be "practice_completed" or "invite_requested"' },
        { status: 400 }
      );
    }

    // Validate event.resultId
    if (!event.resultId || typeof event.resultId !== 'string' || event.resultId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'event.resultId is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate optional score (0-100)
    if (event.score !== undefined) {
      if (typeof event.score !== 'number' || event.score < 0 || event.score > 100) {
        return NextResponse.json(
          { error: 'Invalid request', message: 'event.score must be a number between 0 and 100' },
          { status: 400 }
        );
      }
    }

    // Validate optional skillGaps
    if (event.skillGaps !== undefined) {
      if (!Array.isArray(event.skillGaps) || !event.skillGaps.every((s: any) => typeof s === 'string')) {
        return NextResponse.json(
          { error: 'Invalid request', message: 'event.skillGaps must be an array of strings' },
          { status: 400 }
        );
      }
    }

    // Create event context
    const eventContext: EventContext = {
      type: event.type,
      resultId: event.resultId,
      score: event.score,
      skillGaps: event.skillGaps,
    };

    // Initialize orchestrator
    const orchestrator = new LoopOrchestrator(db);

    // Call orchestrator decision method
    const decision = await orchestrator.decide(userId, eventContext);

    // Calculate elapsed time
    const elapsedTime = performance.now() - startTime;

    // Log performance warning if exceeds target
    if (elapsedTime > 150) {
      console.warn(`Orchestrator decision exceeded target: ${elapsedTime.toFixed(2)}ms (target: 150ms)`);
    }

    // Return response
    return NextResponse.json(
      {
        shouldTrigger: decision.shouldTrigger,
        rationale: decision.rationale,
        loopType: decision.loopType,
        features_used: decision.features_used,
        decisionId: decision.decisionId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in orchestrator decide endpoint:', error);

    // Return 500 for server errors
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Failed to process orchestrator decision',
      },
      { status: 500 }
    );
  }
}


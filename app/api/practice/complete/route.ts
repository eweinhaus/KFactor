import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getTestQuestions } from '@/lib/getTestQuestions';
import { calculateScore, identifySkillGaps } from '@/lib/scoring';
import { PracticeCompleteRequest, PracticeCompleteResponse } from '@/types';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body: PracticeCompleteRequest = await request.json();
    const { userId, answers } = body;

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'userId is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate answers array
    if (!Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'answers must be an array' },
        { status: 400 }
      );
    }

    // Get expected questions
    const questions = getTestQuestions();
    const expectedQuestionIds = new Set(questions.map(q => q.id));

    // Validate answers array has exactly 10 items
    if (answers.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'answers array must have exactly 10 items' },
        { status: 400 }
      );
    }

    // Validate each answer
    const answerQuestionIds = new Set<string>();
    for (const answer of answers) {
      // Validate answer structure
      if (!answer.questionId || typeof answer.questionId !== 'string') {
        return NextResponse.json(
          { error: 'Invalid request', message: 'Each answer must have a valid questionId (string)' },
          { status: 400 }
        );
      }

      if (typeof answer.selectedAnswer !== 'number' || answer.selectedAnswer < 0 || answer.selectedAnswer > 3) {
        return NextResponse.json(
          { error: 'Invalid request', message: 'Each answer must have selectedAnswer as number 0-3' },
          { status: 400 }
        );
      }

      // Check for duplicate questionIds
      if (answerQuestionIds.has(answer.questionId)) {
        return NextResponse.json(
          { error: 'Invalid request', message: 'Duplicate questionId found in answers array' },
          { status: 400 }
        );
      }
      answerQuestionIds.add(answer.questionId);

      // Validate questionId exists in expected questions
      if (!expectedQuestionIds.has(answer.questionId)) {
        return NextResponse.json(
          { error: 'Invalid request', message: `Question ID "${answer.questionId}" is not valid` },
          { status: 400 }
        );
      }
    }

    // Calculate score
    const score = calculateScore(questions, answers);

    // Identify skill gaps
    const skillGaps = identifySkillGaps(questions, answers);

    // Basic eligibility check (score >= 50)
    const shouldShowInvite = score >= 50;

    // Save practice result to Firestore
    const practiceResultRef = await db.collection('practice_results').add({
      user_id: userId,
      score: score,
      skill_gaps: skillGaps,
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    const resultId = practiceResultRef.id;

    // Return response
    const response: PracticeCompleteResponse = {
      resultId,
      score,
      skillGaps,
      shouldShowInvite,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error processing practice completion:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message || 'Failed to process practice completion' },
      { status: 500 }
    );
  }
}

import { Question } from '@/types';
import { QUESTION_BANK } from './questionBank';

/**
 * Returns the same 10 questions always (deterministic).
 * Both frontend and backend use this function to ensure exact same questions.
 * 
 * @returns Array of 10 questions in fixed order
 */
export function getTestQuestions(): Question[] {
  // Hardcode 10 specific question IDs (mix of skills/difficulties)
  const QUESTION_IDS = [
    "alg_1",   // Algebra - easy
    "alg_2",   // Algebra - easy
    "alg_4",   // Algebra - medium
    "geo_1",   // Geometry - easy
    "geo_2",   // Geometry - easy
    "geo_3",   // Geometry - medium
    "calc_1",  // Calculus - easy
    "calc_2",  // Calculus - easy
    "calc_5",  // Calculus - medium
    "alg_7",   // Algebra - medium (system of equations)
  ];

  // Flatten QUESTION_BANK to create a map by question ID
  const questionMap = new Map<string, Question>();
  for (const skillQuestions of Object.values(QUESTION_BANK)) {
    for (const question of skillQuestions) {
      questionMap.set(question.id, question);
    }
  }

  // Return questions in the specified order
  const questions: Question[] = [];
  for (const questionId of QUESTION_IDS) {
    const question = questionMap.get(questionId);
    if (!question) {
      throw new Error(`Question with ID "${questionId}" not found in question bank`);
    }
    questions.push(question);
  }

  if (questions.length !== 10) {
    throw new Error(`Expected 10 questions, got ${questions.length}`);
  }

  return questions;
}

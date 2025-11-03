import { PracticeResult, Question } from '@/types';
import { QUESTION_BANK } from '@/lib/questionBank';

/**
 * Challenge Payload interface for generated challenges
 */
export interface ChallengePayload {
  skill: string;
  questions: Question[];
  shareCopy: string;
  inviterScore: number;
  estimatedTime: string;
}

/**
 * Identifies the weakest skill from skill gaps array
 * 
 * @param skillGaps - Array of skill names (e.g., ["Algebra", "Geometry"])
 * @returns Skill name (first one if multiple, or fallback if empty)
 */
export function identifyWeakestSkill(skillGaps: string[]): string {
  // If empty, return first skill from question bank as fallback
  if (skillGaps.length === 0) {
    const skills = Object.keys(QUESTION_BANK);
    if (skills.length > 0) {
      return skills[0];
    }
    throw new Error('No skills available in question bank');
  }

  // If single skill, return it
  if (skillGaps.length === 1) {
    return skillGaps[0];
  }

  // If multiple skills, return first one (deterministic for MVP)
  return skillGaps[0];
}

/**
 * Gets all questions for a specific skill from question bank
 * 
 * @param skill - Skill name (e.g., "Algebra", "Geometry", "Calculus")
 * @returns Array of questions for that skill
 */
function getQuestionsBySkill(skill: string): Question[] {
  const questions = QUESTION_BANK[skill];
  if (!questions) {
    throw new Error(`Skill "${skill}" not found in question bank`);
  }
  return questions;
}

/**
 * Selects 5 challenge questions from a skill (deterministic selection)
 * 
 * @param skill - Skill name to select questions from
 * @param count - Number of questions to select (default: 5)
 * @returns Array of 5 Question objects
 */
export function selectChallengeQuestions(skill: string, count: number = 5): Question[] {
  const allQuestions = getQuestionsBySkill(skill);
  
  // Select first 5 questions from skill (deterministic for MVP)
  const selected = allQuestions.slice(0, count);
  
  // Validate we have enough questions
  if (selected.length < count) {
    console.warn(`Only ${selected.length} questions available for skill "${skill}", using all available`);
  }
  
  // Validate all questions have same skill
  const allSameSkill = selected.every(q => q.skill === skill);
  if (!allSameSkill) {
    throw new Error(`Not all selected questions have skill "${skill}"`);
  }
  
  return selected;
}

/**
 * Generates personalized share copy based on score and skill
 * 
 * @param score - Practice test score (0-100)
 * @param skill - Skill name (e.g., "Algebra")
 * @param inviterName - First name only (privacy-safe)
 * @returns Personalized share message
 */
export function generateShareCopy(score: number, skill: string, inviterName: string): string {
  // Extract first name only (privacy-safe)
  const firstName = inviterName.split(' ')[0];
  
  // Score-based personalization
  if (score >= 80) {
    // High score
    return `I just crushed ${skill} with ${score}%! Think you can beat me? 😎`;
  } else if (score >= 60) {
    // Medium score
    return `I got ${score}% on ${skill}. Can you do better?`;
  } else {
    // Low score (50-59%)
    return `${skill} is tough! I got ${score}%. Want to practice together?`;
  }
}

/**
 * Main challenge generation function
 * Generates a personalized challenge from practice result
 * 
 * @param result - Practice result with score and skill gaps
 * @param inviterName - User's full name (will be converted to first name only)
 * @returns Complete challenge payload
 */
export function generateChallenge(result: PracticeResult, inviterName: string): ChallengePayload {
  // Validate inputs
  if (!result.score && result.score !== 0) {
    throw new Error('Practice result must have a score');
  }
  
  if (!Array.isArray(result.skill_gaps)) {
    throw new Error('Practice result must have skill_gaps array');
  }

  // Step 1: Identify weakest skill
  const skill = identifyWeakestSkill(result.skill_gaps);

  // Step 2: Select 5 questions for that skill
  const questions = selectChallengeQuestions(skill, 5);

  // Step 3: Generate personalized share copy
  const shareCopy = generateShareCopy(result.score, skill, inviterName);

  // Step 4: Return complete challenge payload
  return {
    skill,
    questions,
    shareCopy,
    inviterScore: result.score,
    estimatedTime: '2 min', // Fixed for 5 questions
  };
}


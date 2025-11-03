import { Question, Answer } from '@/types';

/**
 * Calculates the score based on correct answers
 * @param questions Array of questions
 * @param answers Array of user answers
 * @returns Score as percentage (0-100, rounded to nearest integer)
 */
export function calculateScore(questions: Question[], answers: Answer[]): number {
  if (questions.length === 0) {
    return 0;
  }

  // Create a map of question ID to correct answer
  const correctAnswersMap = new Map<string, number>();
  for (const question of questions) {
    correctAnswersMap.set(question.id, question.correctAnswer);
  }

  // Count correct answers
  let correctCount = 0;
  for (const answer of answers) {
    const correctAnswer = correctAnswersMap.get(answer.questionId);
    if (correctAnswer !== undefined && answer.selectedAnswer === correctAnswer) {
      correctCount++;
    }
  }

  // Calculate percentage and round
  const percentage = (correctCount / questions.length) * 100;
  return Math.round(percentage);
}

/**
 * Identifies skill gaps from incorrect answers
 * @param questions Array of questions
 * @param answers Array of user answers
 * @returns Array of unique skills with incorrect answers
 */
export function identifySkillGaps(questions: Question[], answers: Answer[]): string[] {
  // Create maps for lookup
  const questionMap = new Map<string, Question>();
  for (const question of questions) {
    questionMap.set(question.id, question);
  }

  const correctAnswersMap = new Map<string, number>();
  for (const question of questions) {
    correctAnswersMap.set(question.id, question.correctAnswer);
  }

  // Collect skills from incorrect answers
  const skillGapsSet = new Set<string>();
  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    const correctAnswer = correctAnswersMap.get(answer.questionId);

    if (question && correctAnswer !== undefined) {
      // Check if answer is incorrect
      if (answer.selectedAnswer !== correctAnswer) {
        // Add skill to gaps if it exists
        if (question.skill) {
          skillGapsSet.add(question.skill);
        }
      }
    }
  }

  return Array.from(skillGapsSet);
}

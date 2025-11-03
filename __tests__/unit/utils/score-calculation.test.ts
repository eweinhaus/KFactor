/**
 * Score Calculation Tests
 */

import { describe, it, expect } from 'vitest';
import { Answer, Question } from '@/types';
import { calculateScore } from '@/lib/scoring';

describe('Score Calculation', () => {
  const questions: Question[] = [
    { id: 'q1', text: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, skill: 'Algebra' },
    { id: 'q2', text: 'Q2', options: ['A', 'B', 'C', 'D'], correctAnswer: 1, skill: 'Geometry' },
    { id: 'q3', text: 'Q3', options: ['A', 'B', 'C', 'D'], correctAnswer: 2, skill: 'Calculus' },
    { id: 'q4', text: 'Q4', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, skill: 'Algebra' },
    { id: 'q5', text: 'Q5', options: ['A', 'B', 'C', 'D'], correctAnswer: 1, skill: 'Geometry' },
  ];

  it('calculates 100% for all correct answers', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 0 },
      { questionId: 'q2', selectedAnswer: 1 },
      { questionId: 'q3', selectedAnswer: 2 },
      { questionId: 'q4', selectedAnswer: 0 },
      { questionId: 'q5', selectedAnswer: 1 },
    ];

    const score = calculateScore(questions, answers);
    expect(score).toBe(100);
  });

  it('calculates 0% for all wrong answers', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 1 },
      { questionId: 'q2', selectedAnswer: 0 },
      { questionId: 'q3', selectedAnswer: 1 },
      { questionId: 'q4', selectedAnswer: 1 },
      { questionId: 'q5', selectedAnswer: 0 },
    ];

    const score = calculateScore(questions, answers);
    expect(score).toBe(0);
  });

  it('calculates 60% for 3 out of 5 correct', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 0 }, // Correct
      { questionId: 'q2', selectedAnswer: 1 }, // Correct
      { questionId: 'q3', selectedAnswer: 2 }, // Correct
      { questionId: 'q4', selectedAnswer: 1 }, // Wrong
      { questionId: 'q5', selectedAnswer: 0 }, // Wrong
    ];

    const score = calculateScore(questions, answers);
    expect(score).toBe(60);
  });

  it('handles empty questions array', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 0 },
    ];
    const score = calculateScore([], answers);
    expect(score).toBe(0);
  });

  it('handles partial answers (missing questions)', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 0 }, // Correct
      { questionId: 'q2', selectedAnswer: 1 }, // Correct
      // Missing q3, q4, q5 - these count as 0 correct out of 5 total
    ];

    // Score is based on total questions, not just answered
    // 2 correct out of 5 total = 40%
    const score = calculateScore(questions, answers);
    expect(score).toBe(40);
  });
});


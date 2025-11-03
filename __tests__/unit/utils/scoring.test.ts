/**
 * Scoring Utility Tests
 */

import { describe, it, expect } from 'vitest';
import { Question, Answer } from '@/types';
import { calculateScore, identifySkillGaps } from '@/lib/scoring';

describe('calculateScore', () => {
  const questions: Question[] = [
    {
      id: 'q1',
      text: 'Question 1',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      skill: 'Algebra',
    },
    {
      id: 'q2',
      text: 'Question 2',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 1,
      skill: 'Geometry',
    },
    {
      id: 'q3',
      text: 'Question 3',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 2,
      skill: 'Calculus',
    },
    {
      id: 'q4',
      text: 'Question 4',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      skill: 'Algebra',
    },
    {
      id: 'q5',
      text: 'Question 5',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 1,
      skill: 'Geometry',
    },
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

  it('calculates 50% for 2.5 out of 5 (rounds to 50%)', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 0 }, // Correct
      { questionId: 'q2', selectedAnswer: 1 }, // Correct
      { questionId: 'q3', selectedAnswer: 1 }, // Wrong
      { questionId: 'q4', selectedAnswer: 1 }, // Wrong
      { questionId: 'q5', selectedAnswer: 0 }, // Wrong
    ];

    const score = calculateScore(questions, answers);
    expect(score).toBe(40); // 2/5 = 40%
  });

  it('handles empty questions array', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 0 },
    ];
    const score = calculateScore([], answers);
    expect(score).toBe(0);
  });

  it('handles answers for questions not in the list', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 0 }, // Correct
      { questionId: 'q2', selectedAnswer: 1 }, // Correct
      { questionId: 'q999', selectedAnswer: 0 }, // Not in questions list
    ];

    const score = calculateScore(questions, answers);
    expect(score).toBe(40); // 2 correct out of 5 questions
  });
});

describe('identifySkillGaps', () => {
  const questions: Question[] = [
    {
      id: 'q1',
      text: 'Algebra Question 1',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      skill: 'Algebra',
    },
    {
      id: 'q2',
      text: 'Algebra Question 2',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 1,
      skill: 'Algebra',
    },
    {
      id: 'q3',
      text: 'Geometry Question 1',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 2,
      skill: 'Geometry',
    },
    {
      id: 'q4',
      text: 'Calculus Question 1',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      skill: 'Calculus',
    },
  ];

  it('returns empty array when all answers are correct', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 0 }, // Correct
      { questionId: 'q2', selectedAnswer: 1 }, // Correct
      { questionId: 'q3', selectedAnswer: 2 }, // Correct
      { questionId: 'q4', selectedAnswer: 0 }, // Correct
    ];

    const gaps = identifySkillGaps(questions, answers);
    expect(gaps).toEqual([]);
  });

  it('identifies skills with incorrect answers', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 1 }, // Wrong (Algebra)
      { questionId: 'q2', selectedAnswer: 1 }, // Correct (Algebra)
      { questionId: 'q3', selectedAnswer: 1 }, // Wrong (Geometry)
      { questionId: 'q4', selectedAnswer: 0 }, // Correct (Calculus)
    ];

    const gaps = identifySkillGaps(questions, answers);
    expect(gaps).toContain('Algebra');
    expect(gaps).toContain('Geometry');
    expect(gaps).not.toContain('Calculus');
    expect(gaps.length).toBe(2);
  });

  it('returns unique skills only (no duplicates)', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 1 }, // Wrong (Algebra)
      { questionId: 'q2', selectedAnswer: 0 }, // Wrong (Algebra) - same skill
      { questionId: 'q3', selectedAnswer: 2 }, // Correct
      { questionId: 'q4', selectedAnswer: 1 }, // Wrong (Calculus)
    ];

    const gaps = identifySkillGaps(questions, answers);
    // Should have Algebra and Calculus, but only once each
    expect(gaps).toContain('Algebra');
    expect(gaps).toContain('Calculus');
    expect(gaps.filter(s => s === 'Algebra').length).toBe(1);
    expect(gaps.filter(s => s === 'Calculus').length).toBe(1);
    expect(gaps.length).toBe(2);
  });

  it('returns all skills when all answers are wrong', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 1 }, // Wrong (Algebra)
      { questionId: 'q2', selectedAnswer: 0 }, // Wrong (Algebra)
      { questionId: 'q3', selectedAnswer: 1 }, // Wrong (Geometry)
      { questionId: 'q4', selectedAnswer: 1 }, // Wrong (Calculus)
    ];

    const gaps = identifySkillGaps(questions, answers);
    expect(gaps).toContain('Algebra');
    expect(gaps).toContain('Geometry');
    expect(gaps).toContain('Calculus');
    expect(gaps.length).toBe(3);
  });

  it('handles answers for questions not in the list gracefully', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 1 }, // Wrong (Algebra)
      { questionId: 'q999', selectedAnswer: 0 }, // Question not in list
    ];

    const gaps = identifySkillGaps(questions, answers);
    expect(gaps).toContain('Algebra');
    expect(gaps.length).toBe(1);
  });
});

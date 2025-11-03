/**
 * Skill Gap Identification Tests
 */

import { describe, it, expect } from 'vitest';
import { Answer, Question } from '@/types';
import { identifySkillGaps } from '@/lib/scoring';

describe('Skill Gap Identification', () => {
  const questions: Question[] = [
    { id: 'q1', text: 'Question 1', options: ['A', 'B'], correctAnswer: 0, skill: 'Algebra' },
    { id: 'q2', text: 'Question 2', options: ['A', 'B'], correctAnswer: 0, skill: 'Algebra' },
    { id: 'q3', text: 'Question 3', options: ['A', 'B'], correctAnswer: 0, skill: 'Geometry' },
    { id: 'q4', text: 'Question 4', options: ['A', 'B'], correctAnswer: 0, skill: 'Geometry' },
    { id: 'q5', text: 'Question 5', options: ['A', 'B'], correctAnswer: 0, skill: 'Calculus' },
  ];

  it('identifies all skills when all answers wrong', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 1 }, // Wrong (Algebra)
      { questionId: 'q2', selectedAnswer: 1 }, // Wrong (Algebra)
      { questionId: 'q3', selectedAnswer: 1 }, // Wrong (Geometry)
      { questionId: 'q4', selectedAnswer: 1 }, // Wrong (Geometry)
      { questionId: 'q5', selectedAnswer: 1 }, // Wrong (Calculus)
    ];

    const skillGaps = identifySkillGaps(questions, answers);
    expect(skillGaps).toHaveLength(3);
    expect(skillGaps).toContain('Algebra');
    expect(skillGaps).toContain('Geometry');
    expect(skillGaps).toContain('Calculus');
  });

  it('returns empty array when all answers correct', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 0 }, // Correct
      { questionId: 'q2', selectedAnswer: 0 }, // Correct
      { questionId: 'q3', selectedAnswer: 0 }, // Correct
      { questionId: 'q4', selectedAnswer: 0 }, // Correct
      { questionId: 'q5', selectedAnswer: 0 }, // Correct
    ];

    const skillGaps = identifySkillGaps(questions, answers);
    expect(skillGaps).toHaveLength(0);
  });

  it('returns unique skills (no duplicates)', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 1 }, // Wrong (Algebra)
      { questionId: 'q2', selectedAnswer: 1 }, // Wrong (Algebra) - duplicate skill
      { questionId: 'q3', selectedAnswer: 0 }, // Correct
    ];

    const skillGaps = identifySkillGaps(questions, answers);
    expect(skillGaps).toHaveLength(1);
    expect(skillGaps).toContain('Algebra');
  });

  it('handles partial wrong answers', () => {
    const answers: Answer[] = [
      { questionId: 'q1', selectedAnswer: 0 }, // Correct
      { questionId: 'q2', selectedAnswer: 1 }, // Wrong (Algebra)
      { questionId: 'q3', selectedAnswer: 1 }, // Wrong (Geometry)
      { questionId: 'q4', selectedAnswer: 0 }, // Correct
      { questionId: 'q5', selectedAnswer: 0 }, // Correct
    ];

    const skillGaps = identifySkillGaps(questions, answers);
    expect(skillGaps).toHaveLength(2);
    expect(skillGaps).toContain('Algebra');
    expect(skillGaps).toContain('Geometry');
  });
});


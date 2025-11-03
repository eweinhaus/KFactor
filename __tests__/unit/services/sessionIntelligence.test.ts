import { describe, it, expect } from 'vitest';
import {
  identifyWeakestSkill,
  selectChallengeQuestions,
  generateShareCopy,
  generateChallenge,
} from '@/services/sessionIntelligence';
import type { PracticeResult } from '@/types';
import { Timestamp } from 'firebase/firestore';

describe('Session Intelligence Service', () => {
  describe('identifyWeakestSkill', () => {
    it('should return first skill from question bank when skillGaps is empty', () => {
      const skill = identifyWeakestSkill([]);
      expect(['Algebra', 'Geometry', 'Calculus']).toContain(skill);
    });

    it('should return the skill when skillGaps has one skill', () => {
      const skill = identifyWeakestSkill(['Algebra']);
      expect(skill).toBe('Algebra');
    });

    it('should return first skill when skillGaps has multiple skills (deterministic)', () => {
      const skill = identifyWeakestSkill(['Geometry', 'Algebra', 'Calculus']);
      expect(skill).toBe('Geometry');
    });

    it('should return first skill when skillGaps has two skills', () => {
      const skill = identifyWeakestSkill(['Calculus', 'Geometry']);
      expect(skill).toBe('Calculus');
    });
  });

  describe('selectChallengeQuestions', () => {
    it('should return exactly 5 questions for a skill', () => {
      const questions = selectChallengeQuestions('Algebra', 5);
      expect(questions.length).toBe(5);
      expect(questions.every(q => q.skill === 'Algebra')).toBe(true);
    });

    it('should return all available questions if less than requested count', () => {
      // This test assumes there are at least 3 questions in Algebra
      const questions = selectChallengeQuestions('Algebra', 3);
      expect(questions.length).toBe(3);
      expect(questions.every(q => q.skill === 'Algebra')).toBe(true);
    });

    it('should return questions with same skill', () => {
      const questions = selectChallengeQuestions('Geometry', 5);
      expect(questions.every(q => q.skill === 'Geometry')).toBe(true);
    });

    it('should throw error for invalid skill', () => {
      expect(() => selectChallengeQuestions('InvalidSkill', 5)).toThrow();
    });

    it('should return deterministic questions (same order)', () => {
      const questions1 = selectChallengeQuestions('Algebra', 5);
      const questions2 = selectChallengeQuestions('Algebra', 5);
      expect(questions1.map(q => q.id)).toEqual(questions2.map(q => q.id));
    });
  });

  describe('generateShareCopy', () => {
    it('should generate high score message (≥80%)', () => {
      const copy = generateShareCopy(85, 'Algebra', 'John Doe');
      expect(copy).toContain('crushed');
      expect(copy).toContain('85%');
      expect(copy).toContain('Algebra');
      expect(copy).not.toContain('Doe'); // Privacy-safe (first name only)
    });

    it('should generate medium score message (60-79%)', () => {
      const copy = generateShareCopy(70, 'Geometry', 'Jane Smith');
      expect(copy).toContain('got');
      expect(copy).toContain('70%');
      expect(copy).toContain('Geometry');
      expect(copy).toContain('Can you do better');
      expect(copy).not.toContain('Smith'); // Privacy-safe
    });

    it('should generate low score message (50-59%)', () => {
      const copy = generateShareCopy(55, 'Calculus', 'Bob Johnson');
      expect(copy).toContain('tough');
      expect(copy).toContain('55%');
      expect(copy).toContain('Calculus');
      expect(copy).toContain('practice together');
      expect(copy).not.toContain('Johnson'); // Privacy-safe
    });

    it('should extract first name only from full name', () => {
      const copy = generateShareCopy(90, 'Algebra', 'John Michael Doe');
      // Should only use first name in message context (if used)
      expect(copy).not.toContain('Michael');
      expect(copy).not.toContain('Doe');
    });

    it('should handle boundary score 80% as high', () => {
      const copy = generateShareCopy(80, 'Geometry', 'Alice');
      expect(copy).toContain('crushed');
    });

    it('should handle boundary score 60% as medium', () => {
      const copy = generateShareCopy(60, 'Calculus', 'Bob');
      expect(copy).toContain('got');
      expect(copy).toContain('Can you do better');
    });

    it('should handle boundary score 50% as low', () => {
      const copy = generateShareCopy(50, 'Algebra', 'Charlie');
      expect(copy).toContain('tough');
      expect(copy).toContain('practice together');
    });
  });

  describe('generateChallenge', () => {
    const createMockResult = (score: number, skillGaps: string[]): PracticeResult => ({
      id: 'test_result_1',
      user_id: 'user_1',
      score,
      skill_gaps: skillGaps,
      completed_at: Timestamp.now() as any,
    });

    it('should generate complete challenge payload', () => {
      const result = createMockResult(75, ['Algebra']);
      const challenge = generateChallenge(result, 'John Doe');

      expect(challenge).toHaveProperty('skill');
      expect(challenge).toHaveProperty('questions');
      expect(challenge).toHaveProperty('shareCopy');
      expect(challenge).toHaveProperty('inviterScore');
      expect(challenge).toHaveProperty('estimatedTime');

      expect(challenge.skill).toBe('Algebra');
      expect(challenge.questions.length).toBe(5);
      expect(challenge.inviterScore).toBe(75);
      expect(challenge.estimatedTime).toBe('2 min');
    });

    it('should handle empty skillGaps with fallback', () => {
      const result = createMockResult(80, []);
      const challenge = generateChallenge(result, 'Jane');

      expect(challenge.skill).toBeDefined();
      expect(['Algebra', 'Geometry', 'Calculus']).toContain(challenge.skill);
      expect(challenge.questions.length).toBe(5);
    });

    it('should throw error for invalid result (missing score)', () => {
      const result = createMockResult(0, ['Algebra']);
      // Score of 0 is valid, but let's test with undefined
      const invalidResult = { ...result, score: undefined as any };
      expect(() => generateChallenge(invalidResult, 'Test')).toThrow();
    });

    it('should throw error for invalid result (missing skill_gaps)', () => {
      const result = createMockResult(70, ['Algebra']);
      const invalidResult = { ...result, skill_gaps: undefined as any };
      expect(() => generateChallenge(invalidResult, 'Test')).toThrow();
    });

    it('should generate challenge with multiple skill gaps (uses first)', () => {
      const result = createMockResult(65, ['Geometry', 'Algebra', 'Calculus']);
      const challenge = generateChallenge(result, 'Bob');

      expect(challenge.skill).toBe('Geometry');
      expect(challenge.questions.length).toBe(5);
      expect(challenge.questions.every(q => q.skill === 'Geometry')).toBe(true);
    });

    it('should generate appropriate share copy based on score', () => {
      const highResult = createMockResult(85, ['Algebra']);
      const highChallenge = generateChallenge(highResult, 'Alice');
      expect(highChallenge.shareCopy).toContain('crushed');

      const mediumResult = createMockResult(70, ['Geometry']);
      const mediumChallenge = generateChallenge(mediumResult, 'Bob');
      expect(mediumChallenge.shareCopy).toContain('Can you do better');

      const lowResult = createMockResult(55, ['Calculus']);
      const lowChallenge = generateChallenge(lowResult, 'Charlie');
      expect(lowChallenge.shareCopy).toContain('practice together');
    });
  });
});


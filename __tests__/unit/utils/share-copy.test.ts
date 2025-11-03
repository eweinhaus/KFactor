/**
 * Share Copy Generation Tests
 */

import { describe, it, expect } from 'vitest';

/**
 * Generate share copy based on score
 */
function generateShareCopy(score: number, skill: string): string {
  if (score >= 80) {
    return `I just crushed ${skill} with ${score}%! Think you can beat me? 😎`;
  } else if (score >= 60) {
    return `I got ${score}% on ${skill}. Can you do better?`;
  } else {
    return `${skill} is tough! I got ${score}%. Want to practice together?`;
  }
}

describe('Share Copy Generation', () => {
  it('generates high score copy (≥80%)', () => {
    const copy = generateShareCopy(85, 'Algebra');
    expect(copy).toContain('crushed');
    expect(copy).toContain('85%');
    expect(copy).toContain('Algebra');
    expect(copy).toContain('😎');
  });

  it('generates medium score copy (60-79%)', () => {
    const copy = generateShareCopy(72, 'Geometry');
    expect(copy).toContain('got');
    expect(copy).toContain('72%');
    expect(copy).toContain('Geometry');
    expect(copy).toContain('better');
  });

  it('generates low score copy (50-59%)', () => {
    const copy = generateShareCopy(55, 'Calculus');
    expect(copy).toContain('tough');
    expect(copy).toContain('55%');
    expect(copy).toContain('Calculus');
    expect(copy).toContain('practice together');
  });

  it('handles edge case: exactly 80%', () => {
    const copy = generateShareCopy(80, 'Algebra');
    expect(copy).toContain('crushed');
  });

  it('handles edge case: exactly 60%', () => {
    const copy = generateShareCopy(60, 'Geometry');
    expect(copy).toContain('got');
    expect(copy).not.toContain('crushed');
  });

  it('handles edge case: exactly 59%', () => {
    const copy = generateShareCopy(59, 'Calculus');
    expect(copy).toContain('tough');
  });

  it('handles edge case: 100% score', () => {
    const copy = generateShareCopy(100, 'Algebra');
    expect(copy).toContain('crushed');
    expect(copy).toContain('100%');
  });

  it('handles edge case: 50% score', () => {
    const copy = generateShareCopy(50, 'Geometry');
    expect(copy).toContain('tough');
    expect(copy).toContain('50%');
  });
});



# Product Requirements Document: Session Intelligence - Auto "Beat-My-Skill" Challenge

**Version:** 1.0  
**Date:** 2025-01-21  
**Feature:** MVP Feature 3.3  
**Status:** Ready for Implementation

---

## 1. Overview

### 1.1 Feature Description
Session Intelligence analyzes practice test results to automatically generate personalized challenges and share copy. It identifies skill gaps, selects appropriate questions, and creates contextually relevant messaging that encourages sharing while maintaining privacy standards.

### 1.2 Goals
- Automatically generate challenges from practice test results
- Identify weakest skills for personalized challenges
- Create engaging, personalized share copy
- Select appropriate questions from skill bank
- Enable viral loop without manual input

### 1.3 Success Metrics
- **Challenge Generation**: 100% success rate (no failures)
- **Personalization**: >80% of share copy uses personalized messaging (not generic)
- **Question Selection**: Questions match identified skill 100% of the time
- **Response Time**: <200ms to generate challenge

---

## 2. Architecture

### 2.1 Component Structure

```
Session Intelligence Service
├── Skill Gap Analyzer
│   └── Identifies weakest skill from results
├── Question Selector
│   └── Selects 5 questions from skill bank
└── Share Copy Generator
    └── Creates personalized message based on score
```

### 2.2 Input/Output

**Input:**
- Practice test results (score, skill gaps, answers)
- User context (optional for future personalization)

**Output:**
- Challenge object with questions and metadata
- Personalized share copy
- Skill identification

---

## 3. Skill Gap Analysis

### 3.1 Analysis Process

**Step 1: Extract Skill Performance**
From practice test results, identify performance per skill:

```typescript
interface SkillPerformance {
  skill: string;
  questionsCorrect: number;
  questionsTotal: number;
  score: number;              // 0-100
}
```

**Step 2: Identify Weakest Skill**
Select skill with lowest score (or fewest correct answers if tied).

**Implementation:**
```typescript
function identifyWeakestSkill(skillGaps: string[], answers: Answer[]): string {
  // Calculate score per skill
  const skillScores = calculateSkillScores(answers);
  
  // Sort by score (ascending)
  const sortedSkills = skillScores.sort((a, b) => a.score - b.score);
  
  // Return weakest skill
  return sortedSkills[0].skill;
}
```

### 3.2 Skill Identification from Practice Results

**Data Source:** `practice_results.skill_gaps` array

**Example:**
```typescript
{
  skill_gaps: ["Quadratic Equations", "Geometry - Triangles", "Calculus Basics"]
}
```

**Logic:**
- For MVP, use first skill in `skill_gaps` array (pre-identified as weakest)
- Future: Recalculate based on individual question performance

### 3.3 Fallback Behavior

**If no skill gaps identified:**
- Default to most common skill (e.g., "Algebra")
- Or use skill from practice test category

**If skill gaps array is empty:**
- Use generic skill: "Math Practice"
- Log warning for debugging

---

## 4. Question Selection

### 4.1 Question Bank Structure

**Storage:** Hardcoded array for MVP (future: database)

**Format:**
```typescript
interface Question {
  id: string;
  text: string;
  options: string[];         // 4 options
  correctAnswer: number;     // Index (0-3)
  skill: string;             // Must match skill gap
  difficulty: "easy" | "medium" | "hard";  // Optional
}
```

**Example Question Bank:**
```typescript
const QUESTION_BANK = {
  "Algebra": [
    {
      id: "alg_1",
      text: "Solve: x² + 5x + 6 = 0",
      options: ["x = -2, x = -3", "x = 2, x = 3", "x = -1, x = -6", "x = 1, x = 6"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "medium"
    },
    // ... more questions
  ],
  "Geometry": [
    // Geometry questions
  ],
  // ... more skills
};
```

### 4.2 Selection Algorithm

**Requirements:**
- Select exactly 5 questions
- All questions must match identified skill
- Ensure variety (don't repeat same question types)

**Implementation:**
```typescript
function selectQuestions(skill: string, count: number = 5): Question[] {
  const skillQuestions = QUESTION_BANK[skill] || [];
  
  if (skillQuestions.length < count) {
    // Fallback: Use questions from related skills
    return selectWithFallback(skill, count);
  }
  
  // Randomly select questions (or use difficulty-based selection)
  return shuffleArray(skillQuestions).slice(0, count);
}
```

### 4.3 Question Quality

**Ensures:**
- Questions are appropriate for skill level
- No duplicate questions in same challenge
- Balanced difficulty (mix of easy/medium for MVP)

**Future Enhancements:**
- Match question difficulty to user's skill level
- Avoid questions user already answered correctly
- Adaptive difficulty based on performance

---

## 5. Share Copy Generation

### 5.1 Personalization Logic

**Input:** Score from practice test

**Output:** Personalized message based on score range

### 5.2 Copy Variants

#### High Score (≥80%)
**Tone:** Confident, competitive
**Template:** "I just crushed [Skill] with [Score]%! Think you can beat me? 😎"

**Examples:**
- "I just crushed Algebra with 92%! Think you can beat me? 😎"
- "I just crushed Geometry with 85%! Think you can beat me? 😎"

#### Medium Score (60-79%)
**Tone:** Friendly, challenging
**Template:** "I got [Score]% on [Skill]. Can you do better?"

**Examples:**
- "I got 78% on Algebra. Can you do better?"
- "I got 65% on Geometry. Can you do better?"

#### Low Score (50-59%)
**Tone:** Collaborative, supportive
**Template:** "[Skill] is tough! I got [Score]%. Want to practice together?"

**Examples:**
- "Algebra is tough! I got 58%. Want to practice together?"
- "Geometry is tough! I got 52%. Want to practice together?"

### 5.3 Implementation

```typescript
function generateShareCopy(score: number, skill: string): string {
  if (score >= 80) {
    return `I just crushed ${skill} with ${score}%! Think you can beat me? 😎`;
  } else if (score >= 60) {
    return `I got ${score}% on ${skill}. Can you do better?`;
  } else {
    return `${skill} is tough! I got ${score}%. Want to practice together?`;
  }
}
```

### 5.4 Privacy Considerations

**Requirements:**
- Only include first name (not full name)
- No PII (email, user ID)
- No profile photos
- Generic skill names (not specific topics if sensitive)

**Example Safe Copy:**
- ✅ "Alex got 78% on Algebra. Can you do better?"
- ❌ "alex.smith@email.com got 78% on Quadratic Equations"

---

## 6. Challenge Generation Flow

### 6.1 Complete Process

```
1. Receive practice test results
   ↓
2. Analyze skill gaps
   ↓
3. Identify weakest skill
   ↓
4. Select 5 questions from skill bank
   ↓
5. Generate personalized share copy
   ↓
6. Return challenge object
```

### 6.2 Challenge Object Structure

```typescript
interface GeneratedChallenge {
  skill: string;
  questions: Question[];           // 5 questions
  share_copy: string;               // Personalized message
  inviter_score: number;            // Original practice test score
  estimated_time: string;           // "2 min"
  created_at: timestamp;
}
```

### 6.3 Integration with Viral Loop

**Called By:** `POST /api/invite/create`

**Usage:**
```typescript
// In invite creation endpoint
const challenge = await sessionIntelligence.generateChallenge({
  resultId: result.id,
  score: result.score,
  skillGaps: result.skill_gaps
});

// Store challenge data with invite
await db.invites.create({
  challenge_data: challenge
});
```

---

## 7. API Specifications

### 7.1 Internal Service: `generateChallenge()`

**Method:** Internal function (not exposed as HTTP endpoint)

**Signature:**
```typescript
async function generateChallenge(
  practiceResult: PracticeResult
): Promise<GeneratedChallenge>
```

**Parameters:**
```typescript
{
  resultId: string;
  score: number;
  skillGaps: string[];
  answers?: Answer[];        // Optional for future analysis
}
```

**Returns:**
```typescript
{
  skill: string;
  questions: Question[];
  share_copy: string;
  inviter_score: number;
  estimated_time: string;
}
```

**Error Handling:**
- Invalid practice result → throw Error
- No questions found for skill → use fallback skill
- Generation fails → return default challenge with generic copy

### 7.2 Error Responses

**No Skill Identified:**
- Fallback to "Math Practice"
- Log warning
- Continue with default questions

**No Questions Available:**
- Use questions from related skill
- Or use generic questions
- Log error for monitoring

**Generation Exception:**
- Return minimal challenge (skill + generic copy)
- Log error
- Don't block invite creation

---

## 8. Question Bank Management

### 8.1 MVP Implementation

**Storage:** Hardcoded TypeScript constants

**Location:** `src/data/questionBank.ts`

**Structure:**
```typescript
export const QUESTION_BANK: Record<string, Question[]> = {
  "Algebra": [...],
  "Geometry": [...],
  "Calculus": [...],
  // etc.
};
```

**Minimum Requirements:**
- 5+ questions per skill
- 4 answer options per question
- Correct answer clearly marked

### 8.2 Question Content Guidelines

**Quality:**
- Clear, unambiguous questions
- Only one correct answer
- Appropriate difficulty for skill
- No trick questions (for MVP)

**Format:**
- Multiple choice (4 options)
- Text-based (no images for MVP)
- Self-contained (no external references)

### 8.3 Future Enhancements

**Phase 2:**
- Database storage for questions
- Question difficulty levels
- Image-based questions
- Audio/video questions
- Dynamic question generation (AI-powered)

---

## 9. Performance Requirements

### 9.1 Response Time

**Target:** <200ms total generation time

**Breakdown:**
- Skill analysis: <50ms
- Question selection: <100ms
- Copy generation: <10ms
- Object creation: <40ms

### 9.2 Optimization Strategies

**Caching:**
- Cache question bank in memory (don't reload on each request)
- Cache skill gap analysis results (if same result queried multiple times)

**Pre-computation:**
- Pre-select question sets per skill (not random on each call)
- Pre-generate common share copy variants

---

## 10. Testing Requirements

### 10.1 Unit Tests

**Test Cases:**

1. **Skill Identification**
   - Input: `skillGaps: ["Algebra", "Geometry"]`, `score: 78`
   - Expected: Returns "Algebra" (first in array for MVP)

2. **Question Selection**
   - Input: `skill: "Algebra"`
   - Expected: Returns exactly 5 Algebra questions

3. **Share Copy - High Score**
   - Input: `score: 85`, `skill: "Algebra"`
   - Expected: "I just crushed Algebra with 85%! Think you can beat me? 😎"

4. **Share Copy - Medium Score**
   - Input: `score: 72`, `skill: "Geometry"`
   - Expected: "I got 72% on Geometry. Can you do better?"

5. **Share Copy - Low Score**
   - Input: `score: 55`, `skill: "Calculus"`
   - Expected: "Calculus is tough! I got 55%. Want to practice together?"

6. **Fallback - No Skill**
   - Input: `skillGaps: []`
   - Expected: Uses default skill, logs warning

7. **Fallback - No Questions**
   - Input: `skill: "UnknownSkill"`
   - Expected: Uses fallback questions, logs error

### 10.2 Integration Tests

**Test Scenarios:**

1. **End-to-End Generation**
   - Mock practice result
   - Call generateChallenge()
   - Verify all fields present
   - Verify questions match skill

2. **Error Handling**
   - Test with invalid input
   - Verify graceful fallback
   - Verify error logging

### 10.3 Acceptance Criteria

✅ **Skill Analysis:**
- Correctly identifies weakest skill
- Handles edge cases (empty array, null values)

✅ **Question Selection:**
- Returns exactly 5 questions
- Questions match identified skill
- No duplicate questions

✅ **Share Copy:**
- Personalized based on score
- Privacy-safe (no PII)
- Appropriate tone for score range

✅ **Performance:**
- <200ms generation time
- No memory leaks
- Handles concurrent requests

✅ **Error Handling:**
- Graceful fallback on failures
- No crashes
- Errors logged appropriately

---

## 11. Future Enhancements

**Phase 2 - Advanced Personalization:** Adjust copy by historical performance, match difficulty to user level, avoid already-answered questions

**Phase 3 - AI-Powered:** LLM-generated share copy, AI-generated questions, adaptive difficulty

**Phase 4 - Multi-Skill:** Combine weak skills, progressive difficulty, custom challenge types

**Phase 3 - Analytics:** Track copy conversion rates, A/B test messages, optimize question selection

---

## 12. Dependencies

**Internal:** Practice Results (test data), Question Bank (hardcoded MVP, DB future), Viral Loop (challenge consumption)  
**External:** None (pure logic)

---

## 13. Risks, Privacy & Mitigations

**Technical Risks:** Insufficient questions (fallback to related skills), slow generation (cache bank, optimize), invalid skills (normalize/validate)  
**Product Risks:** Poor copy (A/B test variants), wrong difficulty (match to inviter score future), privacy issues (strict checks, no PII, review copy)

**Privacy Requirements:** Share copy (first name only, no email/ID/profile), challenge data (questions with invite only, no tracking MVP), logging (no PII, anonymize skills, retention policy)

---

**Document Status:** Ready for Implementation  
**Last Updated:** 2025-01-21  
**Related Documents:** PRD_MVP.md, PRD_viral_loop.md


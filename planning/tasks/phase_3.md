# Phase 3: Practice Test Flow
**Goal:** Users can take practice tests and see results  
**Timeline:** Days 3-4 (6-8 hours)  
**Status:** Not Started

---

## Overview

Phase 3 enables users to take practice tests and view their results. This is the entry point for the viral loop - users complete tests, see their scores, and (if eligible) can proceed to challenge friends. The flow is simple: take test → see results → optionally challenge friend.

**Critical Implementation Details:**
- **DO NOT** call Orchestrator during practice completion
- **DO NOT** create share link during practice completion
- Only return `shouldShowInvite: boolean` (basic eligibility check: score ≥50%)
- Orchestrator and invite creation happen later (Phase 5) when user clicks button

**Success Criteria:**
- ✅ Users can take practice test (10 questions displayed)
- ✅ Answers can be selected and submitted
- ✅ Score is calculated correctly
- ✅ Practice result is saved to Firestore
- ✅ Results page displays score and skill gaps
- ✅ "Challenge Friend" button shows conditionally (only if score ≥50%)

---

## Task 1: Practice Test Page (`/practice`)

### Subtasks

1.1. **Create Practice Test Page**
- Create `app/practice/page.tsx`
- Set up basic page structure with Tailwind styling
- Add page title: "Practice Test"

1.2. **Create Shared Question Selection Utility**
- Create `src/lib/getTestQuestions.ts`:
  - Function: `getTestQuestions(): Question[]`
  - Returns same 10 questions always (deterministic)
  - Hardcode 10 specific question IDs (mix of skills/difficulties)
  - Example: `["alg_1", "alg_2", "geo_1", "geo_2", "calc_1", ...]`
  - Import from question bank and return in fixed order
- **Why:** Ensures frontend and backend use exact same questions
- Use this function in both frontend (Task 1) and backend (Task 2)

1.3. **Create Question Display Component**
- Display question text
- Display 4 answer options (radio buttons or clickable buttons)
- Show question number (e.g., "Question 1 of 10")
- Simple styling with Tailwind

1.4. **Implement Answer Selection**
- Track selected answer for each question
- Store in component state: `Map<questionId, selectedAnswerIndex>`
  - Format: `{ questionId: string, selectedAnswer: number }`
- **Important:** Must include `questionId` with each answer (needed for backend scoring)
- Allow changing answers before submit
- **Simplified approach:** Single-page display (all 10 questions at once)
  - Display all 10 questions in fixed order (from `getTestQuestions()`)
  - Alternative: One-at-a-time (more complex, skip for MVP)

1.5. **Add Submit Functionality**
- Create submit button
- Validate: All 10 questions answered (show error if not)
- Validate: Each answer has `questionId` and `selectedAnswer` (0-3)
- On submit:
  - Collect all answers in format: `{ questionId: string, selectedAnswer: number }[]`
  - Include `userId` (hardcoded: `"user_alex"` for MVP)
  - Call `POST /api/practice/complete` with `{ userId, answers }`
  - Show loading state during API call
  - On success: Redirect to `/results/[resultId]` using `router.push()`
  - On error: Show error message, allow retry

1.6. **Add Mock User Selection (MVP)**
- **Simplified approach:** Hardcode user ID (no dropdown needed)
- Use `const userId = "user_alex"` (one of the seed users)
- **Note:** Dropdown can be added later if needed, but hardcode for MVP speed
- Pass `userId` with API call

1.7. **Add Error Handling**
- Handle API errors gracefully
- Show error message if submission fails
- Allow retry

**Potential Pitfalls:**
- ❌ Don't over-complicate UI (simple single-page is fine for MVP)
- ❌ Don't forget to validate all questions answered
- ❌ Don't hardcode answers in component (use question bank)
- ✅ Do use Tailwind for all styling (no custom CSS)
- ✅ Do show loading state during API call
- ✅ Do handle errors gracefully

**Acceptance:**
- [ ] Practice test page loads at `/practice`
- [ ] 10 questions displayed using `getTestQuestions()` utility
- [ ] Users can select answers for all questions (with questionId tracked)
- [ ] Submit button validates all questions answered
- [ ] Submit button works and calls API with correct format
- [ ] Loading state shown during submission
- [ ] Redirects to `/results/[resultId]` on success

---

## Task 2: Practice Completion API (`POST /api/practice/complete`)

### Subtasks

2.1. **Create API Route**
- Create `app/api/practice/complete/route.ts`
- Export `POST` function handler
- Import necessary types and Firebase admin SDK

2.2. **Parse and Validate Request Body**
- Extract `userId` and `answers` from request
- Validate request format:
  - `userId` is string and non-empty
  - `answers` is array
  - Answers array has exactly 10 items (matches questions)
  - Each answer has `questionId` (string) and `selectedAnswer` (number 0-3)
  - All questionIds are valid (match questions from `getTestQuestions()`)
  - No duplicate questionIds in answers array
- Return 400 error with specific message if invalid

2.3. **Load Questions for Scoring**
- Use shared utility: Import `getTestQuestions()` from `src/lib/getTestQuestions.ts`
- **Critical:** Must use exact same questions as frontend (same function ensures this)
- Questions are in same order as frontend (deterministic)

2.4. **Calculate Score**
- Compare user answers to correct answers
- Count correct answers
- Calculate percentage: `(correct / total) * 100`
- Round to nearest integer

2.5. **Identify Skill Gaps**
- Function: `identifySkillGaps(questions: Question[], answers: Answer[]): string[]`
- For each incorrect answer:
  - Find question by `questionId` in answers array
  - Get question's skill (from question object)
  - Add skill to gaps array (if not already present - use Set for uniqueness)
- Handle edge cases:
  - All correct: Return empty array `[]`
  - Question missing skill: Skip that question (log warning)
  - No gaps: Return `[]` (not `null`)
- Return array of unique skills with incorrect answers
- Example: If Algebra questions wrong → `["Algebra"]`

2.6. **Basic Eligibility Check**
- Check: `score >= 50`
- Set `shouldShowInvite = true` if score ≥50%, `false` otherwise
- **Note:** This is NOT Orchestrator decision - just basic eligibility
- **Note:** Orchestrator will do final check later when button clicked

2.7. **Save Practice Result to Firestore**
- Create document in `practice_results` collection
- Fields:
  - `user_id`: From request
  - `score`: Calculated score (0-100)
  - `skill_gaps`: Array of skills with gaps
  - `completed_at`: Firestore server timestamp
- Generate result ID (or use Firestore auto-generated)
- Return result ID

2.8. **Return Response**
- Return JSON response:
  ```typescript
  {
    resultId: string;
    score: number;
    skillGaps: string[];
    shouldShowInvite: boolean;
  }
  ```
- Status: 200 OK

2.9. **Add Error Handling**
- Try-catch around database operations
- Return 500 error if database fails
- Log errors for debugging
- Return user-friendly error messages

**Potential Pitfalls:**
- ❌ Don't call Orchestrator here (that happens later)
- ❌ Don't create share link here (that happens later)
- ❌ Don't forget to use same questions as frontend (deterministic)
- ❌ Don't forget to save to Firestore (resultId needed for redirect)
- ✅ Do validate request format before processing
- ✅ Do handle errors gracefully

**Acceptance:**
- [ ] API endpoint exists at `POST /api/practice/complete`
- [ ] Request validation works (returns 400 for invalid requests with specific messages)
- [ ] Questions loaded using `getTestQuestions()` (same as frontend)
- [ ] Score calculation is accurate (test with known answers)
- [ ] Skill gaps identified correctly (unique, handles edge cases)
- [ ] Practice result saved to Firestore with all required fields
- [ ] Response includes `resultId`, `score`, `skillGaps`, `shouldShowInvite`
- [ ] `shouldShowInvite` is `true` when score ≥50%, `false` otherwise

---

## Task 3: Results Page (`/results/[id]`)

### Subtasks

3.1. **Create Results Page Route**
- Create `app/results/[id]/page.tsx`
- Use Next.js dynamic route: `params.id` contains result ID
- Add page title: "Practice Test Results"

3.2. **Fetch Practice Result**
- **Use Next.js Server Component** (async data fetching):
  - Make page component async: `export default async function ResultsPage({ params })`
  - Fetch data server-side using Firebase Admin SDK (via API route) OR
  - Use Firebase client SDK in Server Component (if compatible)
- **Simplified alternative:** Use Client Component with `useEffect`:
  - Create Client Component: `'use client'`
  - Fetch in `useEffect` using Firebase client SDK
  - Query Firestore `practice_results` collection by ID
- Handle 404: If result not found, show error message
- **Recommendation:** Start with Client Component (simpler for MVP)

3.3. **Create Results Display Component**
- Display score prominently (large number, percentage)
- Show score with color coding:
  - Green if ≥80%
  - Yellow if 60-79%
  - Red if <60%
- Display skill gaps:
  - Title: "Areas to Improve"
  - List of skills (badge/chip style)
- Simple styling with Tailwind

3.4. **Conditional "Challenge Friend" Button**
- Only show button if `shouldShowInvite === true`
- Button text: "Challenge a Friend"
- Button styling: Primary button style (prominent)
- **For MVP:** Button is disabled with tooltip: "Coming in Phase 5"
  - Or: Button visible but shows alert when clicked: "Feature coming soon"
- **Note:** Button functionality will be implemented in Phase 5
- **Important:** Button appearance is critical for demo - it should be visible and styled correctly even if disabled

3.5. **Add Loading State**
- Show loading spinner while fetching result
- Show error message if fetch fails

3.6. **Add Navigation**
- "Take Another Test" button → links to `/practice`
- Or back button to practice page

**Potential Pitfalls:**
- ❌ Don't forget to fetch result from Firestore
- ❌ Don't show button if `shouldShowInvite` is false
- ❌ Don't forget error handling (404, network errors)
- ✅ Do use client SDK for frontend (not admin SDK)
- ✅ Do show loading state during fetch
- ✅ Do make score display prominent

**Acceptance:**
- [ ] Results page loads at `/results/[id]`
- [ ] Practice result fetched from Firestore (using client or server component)
- [ ] Score displayed prominently with color coding
- [ ] Skill gaps displayed correctly (empty array shows "No areas to improve")
- [ ] "Challenge Friend" button shows only if `shouldShowInvite = true`
- [ ] Button is visible and styled (disabled with tooltip for MVP)
- [ ] Error handling for missing results (404 shows error message)
- [ ] Loading state shown during fetch

---

## Task 4: Integration and Testing

### Subtasks

4.1. **Test Complete Flow**
- Take practice test: Navigate to `/practice`
- Answer all 10 questions
- Submit test
- Verify redirect to `/results/[resultId]`
- Verify score is displayed correctly
- Verify skill gaps are shown
- Verify button appears/disappears based on score

4.2. **Test Edge Cases**
- Submit with score <50%: Button should not appear
- Submit with score ≥50%: Button should appear
- Submit with all correct: Score = 100%, no skill gaps
- Submit with all wrong: Score = 0%, all skills in gaps
- Missing result ID: Show error message

4.3. **Verify Firestore Data**
- Check Firestore Console
- Verify practice result documents created
- Verify fields are correct (score, skill_gaps, user_id, completed_at)
- Verify timestamps are set

4.4. **Test API Directly**
- Use Postman or curl to test API endpoint
- Verify request/response format
- Verify error handling

**Potential Pitfalls:**
- ❌ Don't skip testing edge cases (catches bugs early)
- ❌ Don't forget to test with different scores (<50%, ≥50%)
- ❌ Don't assume API works without testing
- ✅ Do test complete flow end-to-end
- ✅ Do verify Firestore data is saved correctly

**Acceptance:**
- [ ] Complete flow works: test → submit → results page
- [ ] Score calculation verified (manual check)
- [ ] Skill gaps identified correctly
- [ ] Button shows/hides based on score
- [ ] Practice results saved to Firestore
- [ ] Error cases handled gracefully

---

## Verification Checklist

Before moving to Phase 4, verify:

- [ ] Practice test page loads and displays 10 questions
- [ ] Users can select answers and submit
- [ ] API endpoint processes requests correctly
- [ ] Score calculation is accurate
- [ ] Skill gaps identified correctly
- [ ] Practice results saved to Firestore
- [ ] Results page displays score and skill gaps
- [ ] "Challenge Friend" button appears only if score ≥50%
- [ ] Complete flow works end-to-end

---

## Potential Pitfalls & Mitigations

### Pitfall 1: Questions Mismatch Between Frontend and Backend
**Issue:** Frontend uses different questions than backend scoring  
**Mitigation:** 
- **Simplified:** Create shared utility function `getTestQuestions()`
- Both frontend and backend import from same file
- Guarantees exact same questions and order
- Hardcode 10 specific question IDs in the function

### Pitfall 2: Score Calculation Wrong
**Issue:** Score doesn't match expected value  
**Mitigation:**
- Test with known answers: All correct = 100%, all wrong = 0%
- Verify answer comparison logic
- Log calculations for debugging

### Pitfall 3: Skill Gaps Not Identified Correctly
**Issue:** Wrong skills in gaps array  
**Mitigation:**
- Use Set to ensure uniqueness (no duplicate skills)
- Test with specific wrong answers (verify correct skills added)
- Verify skill is extracted from question correctly
- Handle edge cases: all correct (empty array), missing skills (skip)
- Test with all wrong answers (should include all skills)

### Pitfall 4: Button Shows When It Shouldn't
**Issue:** Button appears for scores <50%  
**Mitigation:**
- Verify `shouldShowInvite` calculation: `score >= 50`
- Test with score 49% (button should not show)
- Test with score 50% (button should show)

### Pitfall 5: Result Not Saved to Firestore
**Issue:** API succeeds but result not in database  
**Mitigation:**
- Add error handling for Firestore writes
- Verify Firestore connection
- Check Firestore Console after API call
- Log success/failure

### Pitfall 6: Results Page Can't Find Result
**Issue:** 404 error on results page  
**Mitigation:**
- Verify result ID is passed correctly in redirect
- Verify result exists in Firestore
- Check Firestore query syntax
- Handle 404 gracefully with error message

---

## API Request/Response Examples

### Request
```typescript
POST /api/practice/complete
Content-Type: application/json

{
  "userId": "user_alex",
  "answers": [
    { "questionId": "alg_1", "selectedAnswer": 0 },
    { "questionId": "alg_2", "selectedAnswer": 1 },
    // ... 8 more answers
  ]
}
```

### Response (Success)
```typescript
{
  "resultId": "result_abc123",
  "score": 78,
  "skillGaps": ["Algebra", "Geometry"],
  "shouldShowInvite": true
}
```

### Response (Error)
```typescript
{
  "error": "Invalid request",
  "message": "Answers array must have 10 items"
}
```

---

## Component Structure

```
app/
  practice/
    page.tsx          # Practice test page (10 questions)
  results/
    [id]/
      page.tsx        # Results page (displays score, gaps, button)
  api/
    practice/
      complete/
        route.ts      # POST endpoint (calculate score, save result)
```

---

## Dependencies

**External:**
- Firebase Firestore (from Phase 1)
- Question bank (from Phase 1)

**Internal:**
- User types (from Phase 1)
- PracticeResult type (from Phase 1)
- Answer type (from Phase 1)
- Question type (from Phase 1)

---

## Next Steps (Phase 4)

After completing Phase 3, proceed to:
- **Phase 4: Loop Orchestrator Agent** - Build agent that decides when to show invites (final check)

---

## Notes

- **MVP Focus:** Keep UI simple and functional (no animations, no complex interactions)
- **Mock Auth:** Hardcode `userId: "user_alex"` for MVP (no dropdown, no real authentication)
- **Shared Question Logic:** Use `getTestQuestions()` utility to ensure frontend/backend match
- **Answer Format:** Always include `questionId` with each answer (required for backend)
- **Button State:** Button should be visible and styled (disabled with tooltip for MVP)
- **Test Frequently:** Test after each task to catch issues early
- **Question Order:** Use fixed order from `getTestQuestions()` (don't shuffle)

---

**Status:** Ready to Begin  
**Estimated Time:** 6-8 hours  
**Complexity:** Low-Medium (straightforward flow, but requires Firestore integration)


# Phase 4: Loop Orchestrator Agent
**Goal:** AI agent makes intelligent decisions about when to show invites  
**Timeline:** Days 5-6 (6-8 hours)  
**Status:** Not Started

---

## Overview

Phase 4 implements the Loop Orchestrator Agent - the "brain" of the viral growth system. This agent makes intelligent decisions about when to trigger viral loop prompts based on user eligibility, rate limits, and contextual factors. The orchestrator ensures prompts are shown at the right time while preventing spam and abuse.

**Critical Implementation Details:**
- **When Called:** Orchestrator is called from `POST /api/invite/create` (when user clicks "Challenge Friend" button)
- **NOT Called:** During practice completion (Phase 3) - only basic eligibility check there
- **Performance Target:** <150ms total response time (per requirements)
- **Decision Logging:** All decisions logged synchronously to Firestore for auditability

**Success Criteria:**
- ✅ Orchestrator class created and functional
- ✅ All 4 eligibility rules implemented correctly
- ✅ Decision logging works (100% of decisions logged)
- ✅ API endpoint responds in <150ms
- ✅ All decision paths tested (trigger/skip scenarios)

---

## Task 1: LoopOrchestrator Class Implementation

### Subtasks

1.1. **Create Orchestrator Class File**
- Create `src/agents/LoopOrchestrator.ts`
- Import Firebase Admin SDK (`db` from `src/lib/firebase-admin.ts`)
- Import types: `AgentDecision`, `Decision`, `PracticeResult`, `Invite`
- Create class: `export class LoopOrchestrator`

1.2. **Class Constructor**
- Accept Firestore database instance
- Store as private property: `private db: FirebaseFirestore.Firestore`
- Example:
  ```typescript
  constructor(private db: FirebaseFirestore.Firestore) {}
  ```

1.3. **Main Decision Method**
- Create `async decide(userId: string, event: EventContext): Promise<AgentDecision>`
- Event context includes:
  - `type: "practice_completed"` (or `"invite_requested"`)
  - `resultId: string` (practice result ID)
  - `score?: number` (optional, can fetch from result)
  - `skillGaps?: string[]` (optional, can fetch from result)
- Return: `AgentDecision` with `shouldTrigger`, `rationale`, `loopType`, `features_used`

1.4. **Implement Rule 1: Practice Test Completion Check**
- Function: `async checkPracticeCompletion(resultId: string): Promise<PracticeResult | null>`
- Query Firestore `practice_results` collection by `resultId`
- Verify result exists and has `completed_at` timestamp
- Return practice result or null
- If null: Return skip decision with rationale "No practice test completion found"

1.5. **Implement Rule 2: Rate Limiting (Daily Limit)**
- Function: `async getInviteCountToday(userId: string): Promise<number>`
- Query `invites` collection:
  - Filter: `inviter_id == userId`
  - Filter: `created_at >= startOfToday` (UTC midnight)
  - Count results
- **Important:** Use UTC for "today" calculation (consistent across timezones)
- Return count (0-3+)
- If count >= 3: Return skip decision with rationale "Rate limit reached (3/3 invites today)"

1.6. **Implement Rule 3: Cooldown Period Check**
- Function: `async getLastInviteTime(userId: string): Promise<Date | null>`
- Query `invites` collection:
  - Filter: `inviter_id == userId`
  - Order by: `created_at` descending
  - Limit: 1
  - Return `created_at` timestamp of most recent invite
- Calculate hours since last invite:
  ```typescript
  const hoursSince = (Date.now() - lastInvite.getTime()) / (1000 * 60 * 60);
  ```
- If `hoursSince < 1`: Return skip decision with rationale "Cooldown period active (last invite X minutes ago)"

1.7. **Implement Rule 4: Score Threshold Check**
- Get score from practice result (already fetched in Rule 1)
- Check: `score >= 50`
- If score < 50: Return skip decision with rationale "Score too low (X%), may discourage sharing"
- **Note:** Score is already checked in Phase 3, but re-check here for final decision

1.8. **Combine All Rules (Decision Tree)**
- Implement decision logic:
  ```typescript
  // Check all rules in order
  const practiceResult = await checkPracticeCompletion(event.resultId);
  if (!practiceResult) return skip("No practice completion");
  
  const invitesToday = await getInviteCountToday(userId);
  if (invitesToday >= 3) return skip("Rate limit reached");
  
  const lastInvite = await getLastInviteTime(userId);
  if (lastInvite && hoursSince < 1) return skip("Cooldown period");
  
  if (practiceResult.score < 50) return skip("Score too low");
  
  // All rules pass - trigger
  return trigger("buddy_challenge", "All eligibility checks passed");
  ```
- Track `features_used` array: Add each feature checked to the array

1.9. **Decision Logging Method**
- Create `async logDecision(decision: AgentDecision, context: DecisionContext): Promise<string>`
- Create document in `decisions` collection:
  - `user_id`: userId
  - `event_type`: event.type
  - `event_id`: event.resultId
  - `decision`: `"trigger_buddy_challenge"` or `"skip"`
  - `rationale`: decision.rationale
  - `features_used`: decision.features_used
  - `context`: Optional object with score, invites_today, last_invite_hours_ago
  - `created_at`: Firestore server timestamp
- Return decision document ID (for reference)
- **Synchronous logging:** Use `await` (don't fire-and-forget for MVP)

1.10. **Helper Methods**
- `async getPracticeResult(resultId: string): Promise<PracticeResult | null>`
  - Query Firestore `practice_results` by ID
  - Return practice result or null
- `async getInviteCountToday(userId: string): Promise<number>`
  - Query invites for user today (using UTC date)
  - Return count
- `async getLastInviteTime(userId: string): Promise<Date | null>`
  - Query most recent invite for user
  - Return timestamp or null if no invites
- `calculateHoursSince(timestamp: Date): number`
  - Helper to calculate hours between timestamp and now
  - Return number (can be fractional)

**Potential Pitfalls:**
- ❌ Don't forget UTC for "today" calculation (prevents timezone bugs)
- ❌ Don't skip decision logging (required for auditability)
- ❌ Don't make queries sequential if they can be parallel (optimize performance)
- ❌ Don't forget to handle null/undefined cases (practice result missing, no invites)
- ✅ Do use Firestore indexes (from Phase 1) for fast queries
- ✅ Do test each rule independently before combining
- ✅ Do handle errors gracefully (default to skip on errors)

**Acceptance:**
- [ ] LoopOrchestrator class created
- [ ] All 4 eligibility rules implemented
- [ ] Decision logging works (creates documents in Firestore)
- [ ] Helper methods work correctly
- [ ] Error handling in place (try-catch blocks)

---

## Task 2: Orchestrator API Endpoint

### Subtasks

2.1. **Create API Route**
- Create `app/api/orchestrator/decide/route.ts`
- Export `POST` function handler
- Import LoopOrchestrator class and Firebase admin SDK

2.2. **Parse and Validate Request**
- Extract `userId` and `event` from request body
- Validate:
  - `userId` is string and non-empty
  - `event.type` is `"practice_completed"` or `"invite_requested"`
  - `event.resultId` is string and non-empty
  - `event.score` is optional number (0-100)
  - `event.skillGaps` is optional string array
- Return 400 error if invalid

2.3. **Initialize Orchestrator**
- Create orchestrator instance: `const orchestrator = new LoopOrchestrator(db)`
- Get `db` from `src/lib/firebase-admin.ts`

2.4. **Call Orchestrator Decision Method**
- Call: `await orchestrator.decide(userId, event)`
- Wrap in try-catch for error handling
- On error: Return 500 with error message

2.5. **Return Response**
- Return JSON response:
  ```typescript
  {
    shouldTrigger: boolean;
    rationale: string;
    loopType?: string;           // "buddy_challenge" if shouldTrigger = true
    features_used: string[];
    decisionId: string;          // ID of logged decision
  }
  ```
- Status: 200 OK

2.6. **Add Performance Monitoring**
- Log start time before orchestrator call
- Log end time after decision
- Calculate elapsed time
- Log if exceeds 150ms (warning, not error)
- **Note:** For MVP, console.log is fine (no monitoring system needed)

2.7. **Add Error Handling**
- Try-catch around orchestrator call
- Database errors: Return 500 with generic message
- Validation errors: Return 400 with specific message
- Log errors for debugging

**Potential Pitfalls:**
- ❌ Don't expose orchestrator directly (it's an internal endpoint)
- ❌ Don't forget to return decisionId (needed for audit trail)
- ❌ Don't skip error handling (orchestrator can fail)
- ✅ Do validate request format before processing
- ✅ Do log performance metrics (helps optimization)
- ✅ Do return user-friendly error messages

**Acceptance:**
- [ ] API endpoint exists at `POST /api/orchestrator/decide`
- [ ] Request validation works (returns 400 for invalid requests)
- [ ] Orchestrator is called correctly
- [ ] Response includes all required fields
- [ ] Error handling works (returns appropriate status codes)
- [ ] Performance logging in place

---

## Task 3: Database Query Optimization

### Subtasks

3.1. **Verify Firestore Indexes Exist**
- Check that indexes from Phase 1 are deployed:
  - `invites.inviter_id + created_at` (composite index)
  - `invites.created_at` (single field)
  - `decisions.user_id + created_at` (composite index)
- If missing: Deploy indexes via Firebase Console or `firestore.indexes.json`

3.2. **Optimize Invite Count Query**
- Use efficient query:
  ```typescript
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0); // UTC midnight
  
  const invitesSnapshot = await db.collection('invites')
    .where('inviter_id', '==', userId)
    .where('created_at', '>=', todayStart)
    .get();
  
  return invitesSnapshot.size;
  ```
- **Alternative:** Use Firestore count query (if available in your SDK version)
- Ensure index exists for this query

3.3. **Optimize Last Invite Query**
- Use efficient query:
  ```typescript
  const lastInviteSnapshot = await db.collection('invites')
    .where('inviter_id', '==', userId)
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();
  
  if (lastInviteSnapshot.empty) return null;
  return lastInviteSnapshot.docs[0].data().created_at.toDate();
  ```
- Ensure index exists for this query

3.4. **Parallel Query Execution**
- If both queries needed, run in parallel:
  ```typescript
  const [invitesToday, lastInvite] = await Promise.all([
    getInviteCountToday(userId),
    getLastInviteTime(userId)
  ]);
  ```
- Reduces total query time (both queries run simultaneously)

3.5. **Practice Result Query**
- Simple query by ID:
  ```typescript
  const resultDoc = await db.collection('practice_results').doc(resultId).get();
  if (!resultDoc.exists) return null;
  return resultDoc.data() as PracticeResult;
  ```
- No index needed (direct document lookup is fast)

**Potential Pitfalls:**
- ❌ Don't forget to deploy indexes (queries will be slow without them)
- ❌ Don't run queries sequentially if they can be parallel
- ❌ Don't use inefficient queries (e.g., fetch all invites and filter in code)
- ✅ Do verify indexes exist before implementing
- ✅ Do test query performance (should be <50ms each)

**Acceptance:**
- [ ] Firestore indexes deployed and verified
- [ ] Invite count query is efficient (<50ms)
- [ ] Last invite query is efficient (<50ms)
- [ ] Practice result query works (<20ms)
- [ ] Parallel queries implemented where possible

---

## Task 4: Testing and Verification

### Subtasks

4.1. **Test Rule 1: Practice Completion**
- Test with valid resultId: Should pass
- Test with invalid resultId: Should return skip decision
- Test with missing result: Should return skip decision
- Verify rationale is clear

4.2. **Test Rule 2: Rate Limiting**
- Test with 0 invites today: Should pass
- Test with 1 invite today: Should pass
- Test with 2 invites today: Should pass
- Test with 3 invites today: Should return skip
- Test with 4 invites today: Should return skip
- **Edge case:** Test at midnight UTC (boundary condition)

4.3. **Test Rule 3: Cooldown Period**
- Test with no previous invites: Should pass
- Test with last invite 2 hours ago: Should pass
- Test with last invite 1 hour ago: Should pass (exactly 1 hour)
- Test with last invite 59 minutes ago: Should return skip
- Test with last invite 30 minutes ago: Should return skip
- **Edge case:** Test exactly 1 hour boundary

4.4. **Test Rule 4: Score Threshold**
- Test with score 50%: Should pass (boundary)
- Test with score 49%: Should return skip
- Test with score 100%: Should pass
- Test with score 0%: Should return skip

4.5. **Test Combined Rules (All Pass)**
- Test scenario: All rules pass
  - Valid practice result ✅
  - 0 invites today ✅
  - No previous invites ✅
  - Score 78% ✅
- Expected: `shouldTrigger: true`, `loopType: "buddy_challenge"`

4.6. **Test Decision Logging**
- Verify decision is logged to Firestore
- Verify all fields are present (user_id, event_type, decision, rationale, features_used, context)
- Verify timestamp is set
- Verify decisionId is returned

4.7. **Test Performance**
- Measure response time for orchestrator call
- Target: <150ms total
- Test with various scenarios (some fast, some slower)
- Log performance metrics

4.8. **Test Error Handling**
- Test with invalid userId: Should return 400
- Test with missing practice result: Should return skip decision (not error)
- Test with database error: Should return skip decision (graceful degradation)
- Test with network error: Should handle gracefully

**Potential Pitfalls:**
- ❌ Don't skip edge case testing (boundary conditions are where bugs hide)
- ❌ Don't assume performance is good (measure it)
- ❌ Don't forget to test error scenarios (they will happen in production)
- ✅ Do test each rule independently first
- ✅ Do test all combinations of rules
- ✅ Do verify decision logging works

**Acceptance:**
- [ ] All 4 rules tested individually
- [ ] Combined rules tested (all pass, various fails)
- [ ] Decision logging verified (100% of decisions logged)
- [ ] Performance verified (<150ms response time)
- [ ] Error handling tested (graceful degradation)

---

## Verification Checklist

Before moving to Phase 5, verify:

- [ ] LoopOrchestrator class exists and compiles
- [ ] All 4 eligibility rules implemented correctly
- [ ] Decision logging creates documents in Firestore
- [ ] API endpoint responds correctly
- [ ] Response time <150ms (measured)
- [ ] All test scenarios pass
- [ ] Error handling works (graceful degradation)
- [ ] Firestore indexes exist and queries are fast

---

## Potential Pitfalls & Mitigations

### Pitfall 1: "Today" Definition Ambiguity
**Issue:** What does "today" mean? UTC? Local time? When does it reset?  
**Mitigation:**
- **Simplified:** Use UTC for all date calculations
- Calculate "today" as: `new Date()` set to UTC midnight
- Reset at midnight UTC (consistent across all users)
- **Alternative:** Use 24-hour rolling window (more complex, skip for MVP)

### Pitfall 2: Database Query Performance
**Issue:** Multiple sequential queries exceed 150ms target  
**Mitigation:**
- Run queries in parallel where possible: `Promise.all([query1, query2])`
- Ensure Firestore indexes exist (from Phase 1)
- Cache results if needed (refresh every 5 minutes)
- Test query performance: Each query should be <50ms

### Pitfall 3: Race Conditions in Rate Limiting
**Issue:** Two concurrent requests both see 2 invites, both pass (resulting in 4 invites)  
**Mitigation:**
- **Simplified for MVP:** Accept small risk (race condition is rare)
- Log warning if detects potential race condition
- **Future:** Use Firestore transactions for atomic increments
- **Note:** For MVP, this is acceptable risk (can fix in production)

### Pitfall 4: Decision Logging Blocks User Flow
**Issue:** If logging fails, user sees error  
**Mitigation:**
- **Simplified:** Log synchronously (required for auditability)
- If logging fails: Log to console, still return decision
- Don't block user flow on logging failure
- Alert on logging failures (console.log for MVP)

### Pitfall 5: Timezone Handling for Cooldown
**Issue:** 1-hour cooldown calculation depends on timezone  
**Mitigation:**
- Use UTC consistently for all timestamps
- Calculate hours: `(Date.now() - lastInvite.getTime()) / (1000 * 60 * 60)`
- Test with various timezones (all should work with UTC)

### Pitfall 6: Missing Practice Result Data
**Issue:** Practice result deleted or doesn't exist when orchestrator runs  
**Mitigation:**
- Check if result exists before accessing properties
- Return skip decision if result missing: "Practice result not found"
- Don't throw error (graceful degradation)

### Pitfall 7: Over-Engineering the Agent
**Issue:** Adding ML models, complex logic, caching layers  
**Mitigation:**
- **Keep it simple:** Rules-based logic only (no ML for MVP)
- No caching layer (direct queries are fine for MVP)
- Simple TypeScript class (no complex patterns)
- Can optimize later if needed

### Pitfall 8: Query Optimization
**Issue:** Counting invites today is slow without proper indexes  
**Mitigation:**
- Verify indexes exist from Phase 1
- Use efficient queries (where + orderBy, not fetch all)
- Test query performance after indexes deployed
- If still slow: Consider caching (skip for MVP)

### Pitfall 9: Error Handling Complexity
**Issue:** Too many error scenarios to handle  
**Mitigation:**
- **Simplified approach:** Default to skip on any error
- Log errors for debugging
- Return user-friendly error messages
- Don't expose internal errors to users

### Pitfall 10: Testing All Decision Paths
**Issue:** Many combinations of rules (4 rules = 16 combinations)  
**Mitigation:**
- Test each rule independently (4 tests)
- Test all pass (1 test)
- Test each rule fail (4 tests)
- Total: ~10 test cases (sufficient for MVP)

---

## API Request/Response Examples

### Request
```typescript
POST /api/orchestrator/decide
Content-Type: application/json

{
  "userId": "user_alex",
  "event": {
    "type": "practice_completed",
    "resultId": "result_abc123",
    "score": 78,
    "skillGaps": ["Algebra"]
  }
}
```

### Response (Trigger)
```typescript
{
  "shouldTrigger": true,
  "rationale": "User scored 78% on practice test, 1/3 invites used today, last invite 2 hours ago",
  "loopType": "buddy_challenge",
  "features_used": [
    "practice_completion_check",
    "practice_score",
    "invite_count_today",
    "last_invite_timestamp"
  ],
  "decisionId": "decision_xyz789"
}
```

### Response (Skip - Rate Limit)
```typescript
{
  "shouldTrigger": false,
  "rationale": "User has sent 3/3 invites today (rate limit reached)",
  "features_used": ["invite_count_today"],
  "decisionId": "decision_abc123"
}
```

### Response (Error)
```typescript
{
  "error": "Invalid request",
  "message": "userId is required"
}
```

---

## Class Structure Example

```typescript
// src/agents/LoopOrchestrator.ts
import { db } from '@/lib/firebase-admin';
import { AgentDecision, PracticeResult, Invite } from '@/types';

export class LoopOrchestrator {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async decide(
    userId: string,
    event: {
      type: string;
      resultId: string;
      score?: number;
      skillGaps?: string[];
    }
  ): Promise<AgentDecision & { decisionId: string }> {
    // Check all rules
    // Log decision
    // Return decision with decisionId
  }

  private async checkPracticeCompletion(resultId: string): Promise<PracticeResult | null> {
    // Query practice result
  }

  private async getInviteCountToday(userId: string): Promise<number> {
    // Query invites today (UTC)
  }

  private async getLastInviteTime(userId: string): Promise<Date | null> {
    // Query last invite
  }

  private async logDecision(
    decision: AgentDecision,
    context: DecisionContext
  ): Promise<string> {
    // Log to Firestore
    // Return decision ID
  }
}
```

---

## Dependencies

**External:**
- Firebase Firestore (from Phase 1)
- Firestore indexes (from Phase 1)

**Internal:**
- PracticeResult type (from Phase 1)
- Invite type (from Phase 1)
- Decision type (from Phase 1)
- AgentDecision type (from Phase 1)

---

## Next Steps (Phase 5)

After completing Phase 4, proceed to:
- **Phase 5: Invite Creation Flow** - Uses orchestrator to create invites when user clicks button

---

## Notes

- **MVP Focus:** Keep orchestrator simple - rules-based logic only (no ML, no complex caching)
- **Performance:** Target <150ms, but prioritize correctness over speed for MVP
- **Auditability:** All decisions must be logged (required for compliance)
- **Error Handling:** Default to skip on errors (conservative, safer)
- **Testing:** Test each rule independently, then test combinations

---

**Status:** Ready to Begin  
**Estimated Time:** 6-8 hours  
**Complexity:** Medium (requires careful query optimization and rule implementation)



# Phase 2: Seed Data
**Goal:** Populate demo data to show K-factor ≥1.20 working  
**Timeline:** Days 2-3 (6-10 hours)  
**Status:** Not Started

---

## Overview

Phase 2 creates realistic demo data to demonstrate the viral growth system working end-to-end. This is **critical** for the MVP demo - without seed data, the system appears non-functional and K-factor cannot be calculated. The seed script will create 10 users, 20 practice results, 25 invites with realistic funnel progression, decision logs, and pre-populated analytics counters.

**Target K-Factor:** 1.4 (exceeds minimum of 1.20)
- Calculation: (25 invites / 10 users) × (14 FVM / 25 invites) = 2.5 × 0.56 = 1.4

**Success Criteria:**
- ✅ Seed script runs successfully without errors
- ✅ 10 users created with realistic names and XP
- ✅ 20 practice results linked to users
- ✅ 25 invites with proper funnel progression (20 opened, 16 accepted, 14 FVM)
- ✅ Analytics counters match seed data totals
- ✅ K-factor calculation verifies ≥1.20 (target: 1.4)
- ✅ All data relationships valid (invites reference valid users/results)

---

## Task 1: Seed Script Infrastructure

### Subtasks

1.1. **Create Seed Script File**
- Create `scripts/seed-demo-data.ts`
- Set up basic TypeScript structure
- Import Firebase Admin SDK (use `src/lib/firebase-admin.ts`)
- Add main async function: `seedDemoData()`

1.2. **Add Utility Functions**
- Create timestamp helper: Generate timestamps with realistic offsets
- Create ID generator: Use Firestore's auto-generated IDs or custom IDs
- Create short code generator: 6-8 alphanumeric characters, check uniqueness
- Create random number helpers: For scores, delays, etc.

1.3. **Add Safety Features**
- Add confirmation prompt: Ask before clearing existing data
- Add clear function: Option to delete all existing seed data
- Add error handling: Try-catch blocks, log errors
- Add progress logging: Console logs for each step

1.4. **Add Script Execution Setup**
- Add npm script to `package.json`:
  ```json
  {
    "scripts": {
      "seed": "ts-node scripts/seed-demo-data.ts",
      "seed:reset": "ts-node scripts/seed-demo-data.ts --clear"
    }
  }
  ```
- Install `ts-node` if not already installed: `npm install -D ts-node @types/node`
- Test: Script can be run with `npm run seed`

**Potential Pitfalls:**
- ❌ Don't forget to import Firebase Admin SDK (not client SDK)
- ❌ Don't skip error handling (seed scripts can fail silently)
- ❌ Don't hardcode Firebase config (use environment variables)
- ✅ Do test script execution before adding data logic
- ✅ Do add helpful console logs for debugging

**Acceptance:**
- [ ] Seed script file created
- [ ] Script can be executed (`npm run seed`)
- [ ] Firebase Admin SDK connection works
- [ ] Utility functions are available
- [ ] Error handling is in place

---

## Task 2: Seed Users (10 Users)

### Subtasks

2.1. **Define User Data**
- Create user array with 10 users:
  ```typescript
  const seedUsers = [
    { name: "Alex Chen", email: "alex@demo.com", xp: 500 },
    { name: "Sam Rodriguez", email: "sam@demo.com", xp: 350 },
    { name: "Jordan Kim", email: "jordan@demo.com", xp: 280 },
    { name: "Taylor Smith", email: "taylor@demo.com", xp: 420 },
    { name: "Morgan Lee", email: "morgan@demo.com", xp: 300 },
    { name: "Casey Brown", email: "casey@demo.com", xp: 200 },
    { name: "Riley Davis", email: "riley@demo.com", xp: 180 },
    { name: "Avery Wilson", email: "avery@demo.com", xp: 150 },
    { name: "Quinn Martinez", email: "quinn@demo.com", xp: 100 },
    { name: "Cameron Taylor", email: "cameron@demo.com", xp: 90 },
  ];
  ```
- Distribution: 5 active (high XP), 3 moderate (medium XP), 2 inactive (low XP)

2.2. **Create User Creation Function**
- Function: `createUsers(seedUsers: UserSeedData[])`
- For each user:
  - **Use deterministic IDs** (simpler for seed data):
    - Generate ID from email: `alex@demo.com` → `"user_alex"`
    - Or use simple pattern: `"user_1"`, `"user_2"`, etc.
  - Create Firestore document in `users` collection with deterministic ID
  - Generate `created_at` timestamp (spread over last 14 days for realism)
  - Set XP from seed data
  - Return array of created user IDs (deterministic, predictable)
- Use batch writes for efficiency (Firestore batch limit: 500)

2.3. **Add Verification**
- Verify users created: Count documents in `users` collection (should be 10)
- Verify XP values: Check that XP matches seed data
- Verify IDs are deterministic (predictable for linking)
- Log success: "Created 10 users"

**Potential Pitfalls:**
- ❌ Don't create users with duplicate emails (check if exists first, or use `--clear`)
- ❌ Don't forget `created_at` timestamps (required field)
- ❌ Don't use auto-generated IDs (deterministic IDs make linking easier)
- ✅ Do use deterministic IDs (email-based or sequential - easier to link)
- ✅ Do save user IDs for linking to invites/practice results

**Acceptance:**
- [ ] 10 users created successfully
- [ ] Users have realistic names, emails, XP values
- [ ] `created_at` timestamps spread over 14 days
- [ ] Users visible in Firestore Console
- [ ] User IDs saved for later use

---

## Task 3: Seed Practice Results (20 Results)

### Subtasks

3.1. **Define Practice Result Data**
- Create array with 20 practice results
- Link to users (2 per user on average)
- Score range: 55% to 95%
- Skill gaps: Mix of Algebra, Geometry, Calculus
- Example:
  ```typescript
  const seedPracticeResults = [
    { userId: "alex", score: 85, skillGaps: ["Algebra"], daysAgo: 10 },
    { userId: "alex", score: 78, skillGaps: ["Quadratic Equations"], daysAgo: 7 },
    { userId: "sam", score: 72, skillGaps: ["Geometry"], daysAgo: 9 },
    // ... 17 more
  ];
  ```

3.2. **Create Practice Result Creation Function**
- Function: `createPracticeResults(users: User[], seedResults: PracticeResultSeedData[])`
- For each result:
  - Link to valid user (use user IDs from Task 2)
  - Create document in `practice_results` collection
  - Set score from seed data (55-95%)
  - Set skill_gaps array
  - Generate `completed_at` timestamp (based on `daysAgo` offset)
  - Return array of created result IDs

3.3. **Ensure Results Link to Invites**
- Plan which results will generate invites (for Task 4)
- Mark results that will have invites (for later linking)
- Ensure some results are eligible (score ≥50%)

**Potential Pitfalls:**
- ❌ Don't create results with invalid user IDs (verify users exist first)
- ❌ Don't forget `completed_at` timestamps
- ❌ Don't create results with scores <50% if they'll have invites (needs to pass Orchestrator)
- ✅ Do vary scores realistically (mix of high/medium/low)
- ✅ Do link results to diverse users (not all from one user)

**Acceptance:**
- [ ] 20 practice results created
- [ ] Results linked to valid users
- [ ] Scores range 55-95%
- [ ] Skill gaps are populated
- [ ] `completed_at` timestamps are logical (last 14 days)
- [ ] Result IDs saved for later use

---

## Task 4: Seed Invites (25 Invites with Funnel Progression)

### Subtasks

4.1. **Generate Short Codes**
- Use deterministic short codes: `"seed01"`, `"seed02"`, ..., `"seed25"` (sequential)
- No uniqueness checking needed (seed data only, we control all codes)
- Simple and predictable for demo purposes

4.2. **Create Base Invites (25 total)**
- Function: `createInvites(users: User[], results: PracticeResult[])`
- Distribution:
  - 8 invites from active users (Alex, Sam, Jordan)
  - 10 invites from moderate users (Taylor, Morgan, Casey, etc.)
  - 7 invites from other users
- For each invite:
  - Link to inviter (user ID - use deterministic IDs for easier linking)
  - Link to practice result (result ID)
  - Set `loop_type: "buddy_challenge"`
  - Generate `created_at` timestamp (spread over last 7-14 days)
  - Set short code: `"seed01"` through `"seed25"` (sequential)

4.3. **Apply Deterministic Funnel Progression**
- Function: `applyFunnelProgression(invites: Invite[])`
- **Deterministic approach** (not random) for reproducible results:
  - Pre-define which invites are in each stage:
    - First 20 invites: Will be opened
    - First 16 of those 20: Will be accepted
    - First 14 of those 16: Will reach FVM
- Timestamp logic (fixed realistic delays):
  - `opened_at`: `created_at` + 2 hours (if invite is in "opened" list)
  - `accepted_at`: `opened_at` + 1 hour (if invite is in "accepted" list)
  - `fvm_reached_at`: `accepted_at` + 4 hours (if invite is in "FVM" list)
- Ensure logical order: opened > accepted > FVM

4.4. **Link Invitees to Invites**
- For accepted invites (16 total):
  - **Simplified approach:** Reuse existing seed users as invitees (no need to create new users)
  - Assign `invitee_id` to one of the 10 seed users (cycle through them)
  - Set `accepted_at` timestamp (already set in 4.3)

4.5. **Create Challenge Data**
- For each invite, create embedded `challenge_data`:
  - Extract skill from practice result's skill_gaps (use first skill if multiple)
  - Generate share copy based on score:
    - High (≥80%): "I just crushed [Skill] with [Score]%! Think you can beat me? 😎"
    - Medium (60-79%): "I got [Score]% on [Skill]. Can you do better?"
    - Low (50-59%): "[Skill] is tough! I got [Score]%. Want to practice together?"
  - **Use placeholder questions** (not from question bank):
    - Create 5 simple placeholder Question objects:
      ```typescript
      {
        id: "q1", text: "Sample question 1", options: ["A", "B", "C", "D"],
        correctAnswer: 0, skill: "[Skill]"
      }
      // ... 4 more placeholders
      ```
    - This is sufficient for seed data - actual questions not needed for demo
  - Set inviter name (first name only - extract from user name)

4.6. **Write Invites to Firestore**
- Batch write invites (use Firestore batch writes)
- Verify all 25 invites created
- Log funnel breakdown: "25 sent, 20 opened, 16 accepted, 14 FVM"

**Potential Pitfalls:**
- ❌ Don't create timestamps out of order (opened before created, etc.)
- ❌ Don't use random logic for funnel (use deterministic - easier to verify)
- ❌ Don't create invites with invalid user/result references
- ❌ Don't select real questions from bank (use placeholders - simpler and faster)
- ✅ Do ensure exactly 20 opened, 16 accepted, 14 FVM (for K-factor accuracy)
- ✅ Do use fixed realistic delays (2h, 1h, 4h) - predictable and verifiable
- ✅ Do reuse seed users as invitees (simpler than creating new users)

**Acceptance:**
- [ ] 25 invites created successfully
- [ ] All invites have deterministic short codes (`"seed01"` through `"seed25"`)
- [ ] Funnel progression: 25 sent → 20 opened → 16 accepted → 14 FVM (deterministic)
- [ ] Timestamps are logical (fixed delays: +2h, +1h, +4h)
- [ ] Challenge data embedded in each invite (with placeholder questions)
- [ ] Invites linked to valid users and practice results

---

## Task 5: Seed Decision Logs (30-40 Decisions)

### Subtasks

5.1. **Define Decision Data**
- Create array of decision scenarios:
  - Mix of trigger/skip decisions
  - Various rationales:
    - "Score 78%, 1/3 invites used today"
    - "Rate limit reached (3/3 invites)"
    - "Score too low (45%)"
    - "Last invite sent 30m ago (cooldown required)"
    - "User scored 92%, 0/3 invites used"
  - Link to users and practice results

5.2. **Create Decision Logging Function**
- Function: `createDecisions(users: User[], results: PracticeResult[])`
- For each decision:
  - Link to user (user_id)
  - Link to event (event_id - practice result or invite)
  - Set `event_type`: "practice_completed" or "invite_requested"
  - Set `decision`: "trigger_buddy_challenge" or "skip"
  - Set `rationale`: Human-readable explanation
  - Set `features_used`: Array of features checked
  - Set `context`: Optional context (score, invites_today, etc.)
  - Generate `created_at` timestamp
  - Create document in `decisions` collection

5.3. **Link Decisions to Invites**
- For each invite created (Task 4), create corresponding decision log (25 decisions)
  - Show Orchestrator approved the invite (trigger decision)
  - Rationale: "Score [X]%, [Y]/3 invites used, last invite [Z] hours ago"
- Create 5-10 additional skip decisions for practice results that didn't generate invites
  - Show various skip reasons (rate limit, low score, cooldown)
- **Total: 30-35 decisions** (simplified from 30-40)

**Potential Pitfalls:**
- ❌ Don't create decisions with invalid user/event IDs
- ❌ Don't forget to match decision type to actual outcome (trigger if invite created)
- ❌ Don't create too many decisions (30-35 is sufficient for demo)
- ✅ Do create realistic rationales (show Orchestrator thinking)
- ✅ Do link decisions to actual users/results

**Acceptance:**
- [ ] 30-35 decision logs created
- [ ] Mix of trigger (25) and skip (5-10) decisions
- [ ] Realistic rationales provided
- [ ] Decisions linked to valid users and events
- [ ] `features_used` arrays populated

---

## Task 6: Initialize Analytics Counters

### Subtasks

6.1. **Calculate Seed Totals**
- Verify totals match seed data:
  - `total_users`: 10
  - `total_invites_sent`: 25
  - `total_invites_opened`: 20
  - `total_invites_accepted`: 16
  - `total_fvm_reached`: 14

6.2. **Create/Update Analytics Counters Document**
- Function: `initializeCounters(counters: AnalyticsCountersData)`
- Get or create document with `id: "main"` in `analytics_counters` collection
- Set all counter fields to seed totals
- Set `last_updated` to current timestamp

6.3. **Verify Counters Match Actual Data**
- Query Firestore to verify:
  - Count users: Should be 10
  - Count invites sent: Should be 25
  - Count invites opened: Should be 20
  - Count invites accepted: Should be 16
  - Count FVM reached: Should be 14

**Potential Pitfalls:**
- ❌ Don't hardcode counter values (calculate from actual seed data)
- ❌ Don't forget `last_updated` timestamp
- ❌ Don't create multiple counter documents (should be single "main" document)
- ✅ Do verify counters match actual Firestore data
- ✅ Do ensure document ID is exactly "main"

**Acceptance:**
- [ ] Analytics counters document created/updated
- [ ] All counter fields match seed data totals
- [ ] Counters verified against actual Firestore data
- [ ] Document ID is "main"

---

## Task 7: Verification and Testing

### Subtasks

7.1. **Verify K-Factor Calculation**
- Function: `verifyKFactor()`
- Calculate:
  - Invites per User = total_invites_sent / total_users = 25 / 10 = 2.5
  - Conversion Rate = total_fvm_reached / total_invites_sent = 14 / 25 = 0.56
  - K-factor = 2.5 × 0.56 = 1.4 ✅
- Log result: "K-factor: 1.4 (Target: ≥1.20) ✅"

7.2. **Verify Data Relationships**
- Check all invites reference valid users:
  - Query invites, verify `inviter_id` exists in users
  - Query invites, verify `invitee_id` exists in users (if set)
- Check all invites reference valid practice results:
  - Query invites, verify `practice_result_id` exists in practice_results
- Check all decisions reference valid users:
  - Query decisions, verify `user_id` exists in users

7.3. **Verify Funnel Progression**
- Check timestamp order:
  - All `opened_at` > `created_at`
  - All `accepted_at` > `opened_at` (if both exist)
  - All `fvm_reached_at` > `accepted_at` (if both exist)
- Check funnel counts:
  - Opened ≤ Sent (20 ≤ 25) ✅
  - Accepted ≤ Opened (16 ≤ 20) ✅
  - FVM ≤ Accepted (14 ≤ 16) ✅

7.4. **Manual Firestore Verification**
- Open Firestore Console
- Verify collections:
  - `users`: 10 documents
  - `practice_results`: 20 documents
  - `invites`: 25 documents
  - `decisions`: 30-40 documents
  - `analytics_counters`: 1 document (id: "main")
- Spot-check data:
  - Open random invite, verify challenge_data exists
  - Open random decision, verify rationale is present
  - Check analytics_counters, verify totals match

7.5. **Test Script Idempotency**
- **Use clear-first approach** (simpler and explicit):
  - Add `--clear` flag to script
  - When `--clear` is used, delete all seed data first (ask for confirmation)
  - When `--clear` is not used, show warning if data exists (suggest using `--clear`)
  - Test: Running with `--clear` twice should work
  - Test: Running without `--clear` on existing data shows warning

**Potential Pitfalls:**
- ❌ Don't skip verification (catching errors early saves time)
- ❌ Don't assume K-factor is correct (manually verify)
- ❌ Don't forget to check timestamp ordering
- ✅ Do verify all relationships (prevents runtime errors later)
- ✅ Do test script can be run multiple times

**Acceptance:**
- [ ] K-factor calculation: 1.4 (≥1.20) ✅
- [ ] All data relationships valid (no orphaned references)
- [ ] Funnel progression logical (timestamp order correct)
- [ ] All collections have correct document counts
- [ ] Script can be run multiple times without errors

---

## Verification Checklist

Before moving to Phase 3, verify:

- [ ] Seed script runs successfully: `npm run seed`
- [ ] All 10 users created and visible in Firestore
- [ ] All 20 practice results created and linked to users
- [ ] All 25 invites created with proper funnel (20 opened, 16 accepted, 14 FVM)
- [ ] All decision logs created (30-35 documents)
- [ ] Analytics counters document exists with correct totals
- [ ] K-factor calculation: 1.4 (verified manually and in code)
- [ ] Data relationships verified (no invalid references)
- [ ] Timestamps are logical (no time travel)
- [ ] Script can be run multiple times with `--clear` flag (clear-first approach)

---

## Potential Pitfalls & Mitigations

### Pitfall 1: Timestamp Ordering Issues
**Issue:** `opened_at` before `created_at`, or `fvm_reached_at` before `accepted_at`  
**Mitigation:** 
- Always generate `created_at` first
- Add delays when generating subsequent timestamps: `opened_at = created_at + randomHours(1, 24)`
- Verify timestamp order in Task 7

### Pitfall 2: Invalid User/Result References
**Issue:** Invite references user_id that doesn't exist  
**Mitigation:**
- Create users and results first (Tasks 2-3)
- Save IDs in variables
- Use those IDs when creating invites (Task 4)
- Verify relationships in Task 7

### Pitfall 3: Short Code Collisions
**Issue:** Duplicate short codes created  
**Mitigation:**
- **Simplified:** Use deterministic sequential codes (`"seed01"` through `"seed25"`)
- No uniqueness checking needed (seed data only, we control all codes)
- Simple and predictable

### Pitfall 4: K-Factor Calculation Wrong
**Issue:** Math doesn't add up to ≥1.20  
**Mitigation:**
- Manually calculate: (25/10) × (14/25) = 1.4
- Verify in code: `const kFactor = (invitesSent / users) * (fvmReached / invitesSent)`
- Double-check funnel counts: 25 sent, 14 FVM
- Test calculation function separately

### Pitfall 5: Funnel Progression Not Realistic
**Issue:** All invites immediately opened/accepted (not realistic)  
**Mitigation:**
- **Simplified:** Use fixed realistic delays (deterministic):
  - `opened_at`: `created_at` + 2 hours
  - `accepted_at`: `opened_at` + 1 hour
  - `fvm_reached_at`: `accepted_at` + 4 hours
- Pre-define which invites are in each stage (not random)
- Some invites not opened (20% not opened)
- Some opened not accepted (25% not accepted)
- Some accepted not FVM (12.5% not FVM)

### Pitfall 6: Challenge Data Missing or Invalid
**Issue:** Invites created but challenge_data is empty or invalid  
**Mitigation:**
- Generate challenge_data when creating invite (Task 4.5)
- **Simplified:** Use placeholder questions (not from question bank)
- Include skill, questions (placeholders), share_copy, inviter info
- Verify challenge_data exists in Firestore after seeding
- **Note:** Placeholder questions are fine for seed data - structure matters more than content

### Pitfall 7: Analytics Counters Don't Match
**Issue:** Counters show wrong totals  
**Mitigation:**
- Calculate counters from actual Firestore queries (not hardcoded)
- Verify in Task 7: Query Firestore, compare to counters
- Update counters if mismatch found

---

## Script Structure Example

```typescript
// scripts/seed-demo-data.ts
import { db } from '../src/lib/firebase-admin';
import { Timestamp } from 'firebase/firestore';

async function seedDemoData(clearFirst: boolean = false) {
  try {
    console.log('🌱 Starting seed data creation...');
    
    // 1. Clear existing data (if requested)
    if (clearFirst) {
      await clearExistingData();
    }
    
    // 2. Create users
    console.log('Creating users...');
    const users = await createUsers(seedUsers);
    console.log(`✅ Created ${users.length} users`);
    
    // 3. Create practice results
    console.log('Creating practice results...');
    const results = await createPracticeResults(users, seedPracticeResults);
    console.log(`✅ Created ${results.length} practice results`);
    
    // 4. Create invites with funnel
    console.log('Creating invites with funnel progression...');
    const invites = await createInvites(users, results);
    console.log(`✅ Created ${invites.length} invites`);
    console.log(`   Funnel: ${invites.filter(i => i.opened_at).length} opened, ` +
                `${invites.filter(i => i.invitee_id).length} accepted, ` +
                `${invites.filter(i => i.fvm_reached_at).length} FVM`);
    
    // 5. Create decision logs
    console.log('Creating decision logs...');
    await createDecisions(users, results, invites);
    console.log('✅ Created decision logs');
    
    // 6. Initialize analytics counters
    console.log('Initializing analytics counters...');
    await initializeCounters({
      total_users: users.length,
      total_invites_sent: invites.length,
      total_invites_opened: invites.filter(i => i.opened_at).length,
      total_invites_accepted: invites.filter(i => i.invitee_id).length,
      total_fvm_reached: invites.filter(i => i.fvm_reached_at).length,
    });
    console.log('✅ Analytics counters initialized');
    
    // 7. Verify K-factor
    const kFactor = await verifyKFactor();
    console.log(`\n🎉 Seed data created successfully!`);
    console.log(`   K-factor: ${kFactor} (Target: ≥1.20) ${kFactor >= 1.2 ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// Run script
const clearFirst = process.argv.includes('--clear');
seedDemoData(clearFirst)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## Dependencies

**External:**
- Firebase Admin SDK (from Phase 1)
- Firestore collections created (from Phase 1)

**Internal:**
- User, PracticeResult, Invite types (from Phase 1)
- Question bank (from Phase 1) - for challenge data

---

## Next Steps (Phase 3)

After completing Phase 2, proceed to:
- **Phase 3: Practice Test Flow** - Build practice test page and results page

---

## Notes

- **Critical for Demo:** Seed data is essential - without it, the system appears non-functional
- **Deterministic Approach:** Use deterministic IDs, codes, and funnel progression (not random) - easier to verify and debug
- **K-Factor Target:** Ensure exactly 14 FVM reached (not 13 or 15) for accurate K-factor
- **Simplifications:** 
  - Use placeholder questions (not from question bank)
  - Reuse seed users as invitees (no new users needed)
  - Use clear-first approach for idempotency (simpler)
- **Test Frequently:** Run script and verify in Firestore after each major task

---

**Status:** Ready to Begin  
**Estimated Time:** 6-10 hours  
**Complexity:** Medium-High (funnel logic requires careful timestamp handling)


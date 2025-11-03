# Product Requirements Document: Seed Data Strategy

**Version:** 1.0  
**Date:** 2025-01-21  
**Feature:** MVP Infrastructure  
**Status:** Ready for Implementation

---

## 1. Overview

### 1.1 Purpose
The seed data script creates realistic demo data to demonstrate the viral growth system working end-to-end. This is **critical** for the MVP demo - without seed data, the system appears non-functional and K-factor cannot be calculated.

### 1.2 Goals
- Create realistic scenario showing K-factor ≥ 1.20
- Demonstrate funnel working at each stage
- Show Orchestrator decisions in action
- Enable impressive demo without waiting for real users

### 1.3 Success Criteria
- ✅ K-factor ≥ 1.20 calculated from seed data
- ✅ All funnel stages have data (sent → opened → accepted → FVM)
- ✅ Analytics dashboard shows meaningful metrics
- ✅ Demo scenario is realistic and impressive

---

## 2. Seed Data Requirements

### 2.1 Users (10 total)

**Distribution:**
- 5 active users (sent multiple invites)
- 3 moderate users (sent 1-2 invites)
- 2 inactive users (completed practice, no invites)

**User Details:**
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

### 2.2 Practice Results (20 total)

**Distribution:**
- Spread across all 10 users (2 per user on average)
- Scores: 55% to 95% (realistic range)
- Skills: Algebra, Geometry, Calculus (mix)

**Example:**
```typescript
const seedPracticeResults = [
  { userId: "alex", score: 85, skillGaps: ["Algebra"], completed_at: "2025-01-15" },
  { userId: "alex", score: 78, skillGaps: ["Quadratic Equations"], completed_at: "2025-01-18" },
  { userId: "sam", score: 72, skillGaps: ["Geometry"], completed_at: "2025-01-16" },
  // ... 17 more
];
```

### 2.3 Invites (25 total)

**Distribution for K-factor ≥ 1.20:**
- Total users: 10
- Total invites: 25
- Invites per user: 2.5
- FVM reached: 14
- Conversion rate: 14/25 = 0.56
- **K-factor: 2.5 × 0.56 = 1.4 ✅**

**Funnel Progression:**
- **Sent:** 25 invites
- **Opened:** 20 invites (80% open rate)
- **Accepted:** 16 invites (64% accept rate from opened, 80% from sent)
- **FVM Reached:** 14 invites (56% FVM rate from sent)

**Invite Details:**
- 8 invites from active users (Alex, Sam, Jordan - high activity)
- 10 invites from moderate users (Taylor, Morgan, Casey - medium activity)
- 7 invites from other users
- Mix of opened/not opened, accepted/not accepted, completed/not completed

**Timestamps:**
- Spread over last 7-14 days for realism
- Some invites opened immediately, some with delay
- FVM reached within 1-2 days of acceptance

### 2.4 Decisions (Orchestrator Log)

**Seed 30-40 decision logs:**
- Mix of trigger/skip decisions
- Various rationales:
  - "Score 78%, 1/3 invites used"
  - "Rate limit reached"
  - "Score too low (45%)"
  - "Cooldown period active"
- Show Orchestrator thinking

### 2.5 Analytics Counters

**Pre-populate counters to match seed data:**
```typescript
{
  id: "main",
  total_users: 10,
  total_invites_sent: 25,
  total_invites_opened: 20,
  total_invites_accepted: 16,
  total_fvm_reached: 14,
  last_updated: timestamp
}
```

---

## 3. Script Implementation

### 3.1 File Location
**Path:** `scripts/seed-demo-data.ts`

### 3.2 Script Structure

```typescript
async function seedDemoData() {
  // 1. Clear existing data (optional: ask for confirmation)
  await clearExistingData();
  
  // 2. Create users
  const users = await createUsers(seedUsers);
  
  // 3. Create practice results
  const results = await createPracticeResults(users, seedPracticeResults);
  
  // 4. Create invites with realistic funnel progression
  const invites = await createInvites(users, results, seedInviteData);
  
  // 5. Create decision logs
  await createDecisions(users, results, seedDecisionData);
  
  // 6. Initialize analytics counters
  await initializeCounters(seedCounters);
  
  console.log('✅ Seed data created successfully!');
  console.log(`   Users: ${users.length}`);
  console.log(`   Invites: ${invites.length}`);
  console.log(`   K-factor: ${calculateKFactor()}`);
}
```

### 3.3 Realistic Funnel Generation

**Algorithm:**
```typescript
function generateInviteFunnel(invites: Invite[]): Invite[] {
  for (const invite of invites) {
    // 80% open rate
    if (Math.random() < 0.8) {
      invite.opened_at = invite.created_at + randomHours(1, 24);
      
      // 80% of opened get accepted
      if (Math.random() < 0.8) {
        invite.invitee_id = generateInviteeId();
        invite.accepted_at = invite.opened_at + randomHours(0.5, 2);
        
        // 88% of accepted reach FVM
        if (Math.random() < 0.88) {
          invite.fvm_reached_at = invite.accepted_at + randomHours(1, 48);
        }
      }
    }
  }
  return invites;
}
```

---

## 4. Execution

### 4.1 Running the Script

**Development:**
```bash
npm run seed
# or
ts-node scripts/seed-demo-data.ts
```

**With Confirmation:**
```bash
npm run seed:confirm  # Asks before clearing existing data
```

**Reset (Clear + Seed):**
```bash
npm run seed:reset   # Clears all data, then seeds
```

### 4.2 Verification

**After seeding, verify:**
- ✅ Users created (check Firestore)
- ✅ Practice results linked to users
- ✅ Invites have realistic funnel progression
- ✅ Analytics counters match invite totals
- ✅ K-factor ≥ 1.20
- ✅ Dashboard displays correctly

### 4.3 Demo Mode

**Add demo mode toggle:**
```typescript
// In app config
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Show "Reset Demo Data" button in dev mode
if (DEMO_MODE) {
  // Show reset button in admin panel
}
```

---

## 5. Data Relationships

### 5.1 User → Practice Results
- Each user has 1-3 practice results
- Results have varying scores (55-95%)

### 5.2 Practice Results → Invites
- Not all results generate invites (realistic)
- Active users: 2-3 invites per user
- Moderate users: 1 invite per user
- Inactive users: 0 invites

### 5.3 Invites → Funnel
- Follow realistic conversion rates:
  - Open: 80%
  - Accept (of opened): 80%
  - FVM (of accepted): 88%
  - Overall FVM: ~56%

### 5.4 Decisions → Invites
- Each invite creation has corresponding decision log
- Mix of approved/denied decisions
- Various denial reasons

---

## 6. K-Factor Calculation

### 6.1 Target Scenario

**Seed Data Setup:**
- 10 users
- 25 invites sent
- 14 FVM reached

**Calculation:**
```
Invites per User = 25 / 10 = 2.5
Conversion Rate = 14 / 25 = 0.56
K-factor = 2.5 × 0.56 = 1.4 ✅
```

**Target Met:** K ≥ 1.20 ✅

### 6.2 Alternative Scenarios

**If K-factor too low, adjust:**
- Increase invites per user (add more invites)
- Increase conversion rate (more FVM reached)

**Example:**
- 10 users, 30 invites, 18 FVM
- K = (30/10) × (18/30) = 3.0 × 0.6 = 1.8 ✅

---

## 7. Error Handling

### 7.1 Duplicate Prevention
- Check if data already exists before seeding
- Option to clear existing data first
- Confirm before destructive operations

### 7.2 Data Validation
- Validate all relationships (users exist before invites)
- Ensure timestamps are logical (opened after created, etc.)
- Verify counters match actual data

### 7.3 Rollback
- Keep backup of original data (if exists)
- Log all operations for debugging
- Allow partial rollback if script fails midway

---

## 8. Testing

### 8.1 Unit Tests
- Test each seed function independently
- Verify data relationships
- Check K-factor calculation

### 8.2 Integration Tests
- Run full seed script
- Verify all collections populated
- Check dashboard displays correctly
- Verify funnel metrics accurate

---

## 9. Future Enhancements

### 9.1 Dynamic Seeding
- Generate more random scenarios
- A/B test different K-factor scenarios
- Simulate growth over time

### 9.2 Seeded Scenarios
- "High K-factor" scenario (K = 2.0+)
- "Low conversion" scenario (for optimization demo)
- "Rate limit" scenario (show Orchestrator denying)

---

**Document Status:** Ready for Implementation  
**Last Updated:** 2025-01-21  
**Related Documents:** PRD_MVP.md, PRD_analytics_dashboard.md


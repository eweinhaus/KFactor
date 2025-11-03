# Product Requirements Document (PRD)
## 10x K-Factor Viral Growth System - MVP

**Version:** 1.0  
**Date:** 2025-01-21  
**Status:** MVP Phase

---

## 1. Executive Summary

### Problem Statement
Varsity Tutors needs to transform its learning platform into a social, gamified experience that drives exponential user acquisition through viral growth mechanics. The goal is to achieve a K-factor ≥ 1.20, where each user brings 1.2+ new users through shareable, referable moments.

### Solution Overview
Build a production-ready viral growth system with:
- **1 Viral Loop**: Buddy Challenge (Student → Student)
- **1 Required Agent**: Loop Orchestrator (decision-making with audit logging)
- **1 Session Intelligence Action**: Auto "Beat-My-Skill" Challenge generation
- **Analytics Dashboard**: Real-time K-factor tracking and funnel visualization

### Target Audience (MVP)
- **Primary**: Students (grades 6-12)
- **Out of Scope for MVP**: Parents, Tutors (future phases)

### Success Metrics
- **Primary**: Achieve K ≥ 1.20 for Buddy Challenge loop over a 14-day cohort
- **Secondary**: 
  - +20% lift to first-value moment (FVM) activation
  - Referrals ≥ 30% of new weekly signups
  - <0.5% fraudulent joins
  - ≥ 4.7/5 CSAT on loop prompts & rewards

---

## 2. User Personas & User Stories

### Persona: Student (Alex, Age 16)
**Characteristics:**
- Completes practice tests on Algebra and Geometry
- Competitive, wants to show off achievements
- Active on social media

**User Stories:**
1. **As a student**, after completing a practice test with 78% score, **I want to** challenge a friend to beat my score **so that** we can compete and both earn rewards.

2. **As a student**, when I click a challenge link from a friend, **I want to** see what skill I'm being challenged on and take a quick 5-question quiz **so that** I can prove I'm better.

3. **As a student**, after completing a friend's challenge, **I want to** receive 100 XP reward **so that** I feel rewarded for engaging.

4. **As a student**, **I want to** see my XP total and challenge history **so that** I can track my progress.

---

## 3. MVP Feature Set

The MVP consists of four core features that work together to create a complete viral growth loop:

### 3.1 Viral Loop: Buddy Challenge
**Reference:** See [PRD_viral_loop.md](./PRD_viral_loop.md) for detailed specifications.

**Overview:** After completing a practice test, students can challenge friends to beat their score on a specific skill. Both users earn rewards when the challenge is completed.

**Key Components:**
- Practice test results page with "Challenge a Friend" button
- Share card generation and smart link creation
- Challenge landing page and 5-question quiz
- Reward distribution system

### 3.2 Loop Orchestrator Agent
**Reference:** See [PRD_loop_orchestrator.md](./PRD_loop_orchestrator.md) for detailed specifications.

**Overview:** AI agent that makes intelligent decisions about when to trigger viral loop prompts based on user eligibility, rate limits, and context.

**Key Responsibilities:**
- Eligibility checking and rate limiting (3 invites/day, 1 hour cooldown)
- Score threshold evaluation (≥50%)
- Decision logging with rationale for auditability

### 3.3 Session Intelligence: Auto "Beat-My-Skill" Challenge
**Reference:** See [PRD_session_intelligence.md](./PRD_session_intelligence.md) for detailed specifications.

**Overview:** Automatically generates a 5-question challenge from practice test results, identifying the weakest skill and creating personalized share copy.

**Key Components:**
- Skill gap analysis
- Question selection from skill bank
- Personalized share copy generation

### 3.4 Analytics Dashboard
**Reference:** See [PRD_analytics_dashboard.md](./PRD_analytics_dashboard.md) for detailed specifications.

**Overview:** Real-time dashboard showing K-factor calculation and funnel metrics.

**Key Metrics:**
- K-factor calculation (target: ≥1.20)
- Funnel tracking (sent → opened → accepted → FVM)
- Conversion rates at each stage

---

## 4. Technical Requirements

### 4.1 Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form (form validation)

**Backend:**
- Next.js API Routes
- TypeScript

**Database:**
- Firebase Firestore
- Collections: `users`, `practice_results`, `invites`, `decisions`, `analytics_counters`
- Note: `challenges` data embedded in `invites` collection (simplification)

**Authentication:**
- MVP: Mock auth (hardcoded users for speed)
- Future: Firebase Auth

**Deployment:**
- Vercel (Next.js hosting)

**Analytics:**
- Custom React dashboard (simple HTML table for MVP)
- Pre-calculated counters updated on events (fast queries)
- Future: Recharts for visualizations, cohort filtering

### 4.2 Data Models

#### Users Collection
```typescript
{
  id: string;
  email: string;
  name: string;
  xp: number;
  created_at: timestamp;
}
```

#### Practice Results Collection
```typescript
{
  id: string;
  user_id: string;
  score: number;              // 0-100
  skill_gaps: string[];       // ["Algebra", "Geometry"]
  completed_at: timestamp;
}
```

#### Invites Collection
```typescript
{
  id: string;
  short_code: string;         // "abc123" for vt.ly/abc123
  inviter_id: string;
  loop_type: string;          // "buddy_challenge"
  
  // Funnel tracking
  created_at: timestamp;
  opened_at: timestamp?;      // When link clicked
  invitee_id: string?;       // When they sign up
  fvm_reached_at: timestamp?; // When they complete challenge
  
  // Metadata
  challenge_data: {
    skill: string;
    questions: Question[];
    share_copy: string;
  };
}
```

#### Decisions Collection (Orchestrator Audit Log)
```typescript
{
  id: string;
  user_id: string;
  event_type: string;        // "practice_completed"
  decision: string;          // "trigger_buddy_challenge" | "skip"
  rationale: string;          // "User scored 78%, 1/3 invites today"
  features_used: string[];    // ["practice_score", "invite_count_today"]
  created_at: timestamp;
}
```

#### Analytics Counters Collection
```typescript
{
  id: string;                  // "main" (single document)
  total_users: number;
  total_invites_sent: number;
  total_invites_opened: number;
  total_invites_accepted: number;
  total_fvm_reached: number;
  last_updated: timestamp;
}
```

**Note:** Challenge data is embedded in `invites.challenge_data` to simplify the schema (no separate challenges collection).

### 4.3 API Endpoints

#### POST `/api/practice/complete`
Completes a practice test and checks eligibility for invite prompt.

**Request:**
```typescript
{
  userId: string;
  answers: Answer[];
}
```

**Response:**
```typescript
{
  resultId: string;
  score: number;
  skillGaps: string[];
  shouldShowInvite: boolean;  // Based on Orchestrator eligibility check
}
```

**Note:** Share link is NOT created here. Orchestrator is NOT called here. Only basic eligibility check (score ≥50%) to determine if button should be shown. Actual Orchestrator decision happens when user clicks "Challenge Friend" button via `/api/invite/create`.

#### POST `/api/invite/create`
Creates invite after user clicks "Challenge Friend" button. Orchestrator decision happens here.

**Request:**
```typescript
{
  userId: string;
  resultId: string;
}
```

**Backend Process:**
1. Call Orchestrator to make final decision (re-check eligibility)
2. If approved: Generate challenge via Session Intelligence
3. Create smart link and invite record
4. Update analytics counters
5. Return share URL

**Response:**
```typescript
{
  shortCode: string;
  shareUrl: string;      // "https://vt.ly/abc123"
  shareCard: {
    text: string;        // "I got 78% on Algebra. Can you do better?"
    inviterName: string; // First name only
    score: number;
    skill: string;
  };
}

// OR if Orchestrator denies:
{
  error: "rate_limit_exceeded" | "cooldown_period" | "score_too_low";
  message: string;       // User-friendly message
}
```

#### GET `/api/invite/:shortCode`
Resolves smart link and logs invite opened.

**Response:**
```typescript
{
  inviter: {
    name: string;  // First name only
  };
  challenge: {
    skill: string;
    questions: Question[];
    share_copy: string;
  };
  callToAction: string;
}
```

**Side Effects:**
- Logs `opened_at` timestamp in invites collection (if not already logged)
- Updates analytics counter: `total_invites_opened +1`

#### POST `/api/invite/:shortCode/accept`
User accepts challenge (signs up or logs in).

**Request:**
```typescript
{
  email?: string;
  name: string;
}
```

**Response:**
```typescript
{
  userId: string;
  challenge: Challenge;
}
```

**Side Effects:**
- Creates user account if new
- Logs `invitee_id` and `accepted_at` in invites collection
- Updates analytics counter: `total_invites_accepted +1`

#### POST `/api/challenge/complete`
Submits challenge answers and distributes rewards.

**Request:**
```typescript
{
  challengeId: string;
  userId: string;
  answers: Answer[];
}
```

**Response:**
```typescript
{
  score: number;
  reward: {
    xp: number;
    message: string;
  };
}
```

**Side Effects:**
- Logs `fvm_reached_at` in invites collection
- Updates analytics counter: `total_fvm_reached +1`
- Distributes 100 XP to both inviter and invitee
- Updates user XP totals

#### GET `/api/analytics`
Returns K-factor and funnel metrics.

**Response:**
```typescript
{
  totalUsers: number;
  invitesSent: number;
  invitesAccepted: number;
  kFactor: number;
  funnelData: {
    sent: number;
    opened: number;
    openedRate: number;  // opened / sent
    accepted: number;
    acceptRate: number;  // accepted / opened
    fvm: number;
    fvmRate: number;     // fvm / sent
  };
}
```

#### POST `/api/orchestrator/decide` (Internal)
Called by invite/create endpoint to make final decision when user clicks "Challenge Friend" button.

**Request:**
```typescript
{
  userId: string;
  event: {
    type: "practice_completed";
    score: number;
    skillGaps: string[];
  };
}
```

**Response:**
```typescript
{
  shouldTrigger: boolean;
  rationale: string;
  loopType: string;
  features_used: string[];
}
```

### 4.4 Pages/Routes

```
/                          → Landing/login page
/practice                  → Practice test (10 hardcoded questions)
/results/:resultId         → Results page (score + invite CTA)
/invite/:shortCode         → Challenge landing page
/challenge/:challengeId    → Take the 5-question challenge
/dashboard                 → User dashboard (XP, history)
/analytics                 → Admin analytics (K-factor dashboard)
```

### 4.5 Performance Requirements

- **API Response Time**: <150ms for Orchestrator decisions (per requirements)
- **Concurrency**: MVP doesn't need to handle 5k concurrent (future consideration)
- **Smart Link Resolution**: <500ms from click to landing page render

### 4.6 Security & Privacy

**Privacy-Safe Share Cards:**
- Only include first name (no last name, email, or profile photo)
- No PII in share card images
- Share copy is privacy-conscious

**Rate Limiting:**
- Max 3 invites per user per day
- 1 hour cooldown between invites
- Prevents spam/abuse

**Graceful Degradation:**
- If Orchestrator fails, show default "Challenge a Friend" copy
- If Session Intelligence fails, use generic challenge questions

---

## 5. User Flows

### 5.1 Happy Path: Complete Viral Loop

```
[0:00] Student (Alex) completes practice test
  → 10 questions on Algebra
  → Score: 78%
  → Skill gaps identified: ["Quadratic Equations"]

[0:05] Results page displayed
  → Shows score: 78%
  → Shows skill gaps
  → "Challenge a Friend" button appears (basic eligibility: score ≥50%)

[0:10] Alex clicks "Challenge a Friend"
  → POST /api/invite/create called
  → Orchestrator decides (final eligibility check)
    → Checks: completed test? ✅
    → Checks: invites today < 3? ✅ (0/3)
    → Checks: last invite > 1hr? ✅ (none)
    → Checks: score >= 50? ✅ (78%)
    → Decision: TRIGGER
    → Rationale logged: "Score 78%, 0/3 invites used"
  → Session Intelligence generates challenge
  → Weakest skill: "Quadratic Equations"
  → 5 questions selected from skill bank
  → Share copy: "I got 78% on Algebra. Can you do better?"
  → Smart link generated: vt.ly/a3x9k2

[0:15] Alex shares link with friend (Sam)
  → Share card displayed (privacy-safe)

[0:20] Sam clicks link
  → Invite opened logged (opened_at timestamp)
  → Landing page: "Alex challenged you to beat 78% on Algebra!"
  → Shows 5-question challenge preview

[0:25] Sam signs up/accepts
  → invitee_id logged
  → Account created if new user
  → Challenge page loads

[0:30] Sam completes challenge
  → 5 questions answered
  → Score calculated: 85%
  → FVM reached logged (fvm_reached_at timestamp)

[0:35] Rewards distributed
  → Alex receives 100 XP
  → Sam receives 100 XP
  → Both see success notification

[0:40] Analytics updated
  → K-factor recalculated
  → Funnel metrics updated
  → Dashboard reflects new conversion
```

### 5.2 Edge Cases

**Case 1: User hits rate limit**
- User has sent 3 invites today
- Orchestrator returns `shouldTrigger: false`
- Rationale: "User has sent 3/3 invites today (rate limit)"
- "Challenge a Friend" button does not appear
- Decision logged for auditability

**Case 2: Low score (< 50%)**
- User scores 45% on practice test
- Orchestrator returns `shouldTrigger: false`
- Rationale: "Score too low (45%), may discourage sharing"
- "Challenge a Friend" button does not appear

**Case 3: Cooldown period**
- User sent invite 30 minutes ago
- Orchestrator returns `shouldTrigger: false`
- Rationale: "Last invite sent 30m ago (1hr cooldown required)"
- "Challenge a Friend" button does not appear

**Case 4: Invitee doesn't complete challenge**
- Sam clicks link (opened_at logged)
- Sam signs up (invitee_id logged)
- Sam doesn't complete challenge (no fvm_reached_at)
- Invite tracked as "opened + accepted" but not "FVM reached"
- Rewards not distributed (FVM required)

---

## 6. Success Metrics & Analytics

### 6.1 Primary Metric: K-Factor

**Target:** K ≥ 1.20

**Calculation:**
```
K = (Invites per User) × (Conversion Rate)

Where:
  Invites per User = Total Invites Sent / Total Users in Cohort
  Conversion Rate = Invites with FVM Reached / Total Invites Sent

Example:
  Cohort: 10 users
  Invites Sent: 15
  FVM Reached: 12
  
  Invites per User = 15 / 10 = 1.5
  Conversion Rate = 12 / 15 = 0.8
  K = 1.5 × 0.8 = 1.2 ✅ (Meets target)
```

### 6.2 Funnel Metrics

Track at each stage:
1. **Sent**: Invites created
2. **Opened**: Invites where link was clicked (opened_at exists)
3. **Accepted**: Invites where user signed up (invitee_id exists)
4. **FVM Reached**: Invites where challenge completed (fvm_reached_at exists)

**Conversion Rates:**
- Open Rate = Opened / Sent
- Accept Rate = Accepted / Opened
- FVM Rate = FVM Reached / Sent
- Overall Conversion = FVM Reached / Sent

### 6.3 Cohort Tracking

**MVP Simplification:** Use "All Time" metrics instead of 14-day cohort filtering to avoid complex Firestore queries.

**Metrics:**
- Total users (all time)
- Total invites sent (all time)
- Calculate K-factor from all-time metrics
- Future: Add cohort filtering in Phase 2

**Rationale:** Pre-calculated counters approach is faster and simpler. Cohort filtering can be added later without blocking MVP.

### 6.4 Guardrail Metrics

**Abuse Prevention:**
- Fraud rate: <0.5% (duplicate accounts, fake invites)
- Opt-out rate: <1% (users who disable invites)

**Performance:**
- Orchestrator decision latency: <150ms (per requirements)
- API response times: <500ms (p95)

**Quality:**
- CSAT on prompts: ≥4.7/5 (user satisfaction)

---

## 7. Constraints & Considerations

### 7.1 Privacy & Compliance

**COPPA/FERPA Considerations (Future):**
- MVP: No child-specific data handling (assume users 13+)
- Future: Parental gates, consent flows for minors

**Privacy-Safe Defaults:**
- Share cards contain no PII (first name only)
- No email addresses in shareable content
- No profile photos in share cards

### 7.2 Technical Constraints

**Rate Limiting:**
- 3 invites per user per day (hard limit)
- 1 hour cooldown between invites

**Score Threshold:**
- Don't show invite for scores < 50% (too discouraging)

**Graceful Degradation:**
- If Orchestrator fails, show default copy
- If Session Intelligence fails, use generic questions
- If analytics fails, show "Data unavailable"

### 7.3 MVP Limitations (Out of Scope)

**Not Included:**
- ❌ Other viral loops (only Buddy Challenge)
- ❌ Parent persona
- ❌ Tutor persona
- ❌ Real-time presence ("X friends online")
- ❌ Leaderboards
- ❌ Activity feeds
- ❌ Real session transcription (mocked from practice results)
- ❌ Email/SMS sending (share link shown in UI)
- ❌ A/B testing
- ❌ Other agents (Personalization, Experimentation, etc.)
- ❌ Mobile native app (responsive web only)
- ❌ Share card image generation (text-only for MVP)
- ❌ 14-day cohort filtering (All-Time metrics for MVP)
- ❌ Complex Firestore analytics queries (pre-calculated counters)

**These are planned for future phases.**

---

## 8. Implementation Timeline

### Week 1: Foundation & Core Loop
- **Day 1-2**: Project setup (Next.js + Firebase)
- **Day 3-4**: Practice test page + results page
- **Day 5-7**: Orchestrator agent + invite flow

### Week 2: Challenge & Analytics
- **Day 8-9**: Session Intelligence (challenge generation)
- **Day 10-11**: Challenge completion + rewards
- **Day 12-14**: Analytics dashboard + polish

**Total Timeline: 7-10 days** (add 3-4 day buffer for unexpected issues)

---

## 9. Seed Data Strategy for Demo

### 9.1 Purpose
To demonstrate K-factor ≥ 1.20 and show the viral loop working end-to-end, realistic demo data must be seeded before the demo. This is **critical** - without seed data, the system appears non-functional.

### 9.2 Seed Data Requirements

**Users:**
- Create 10 seed users with realistic names
- Mix of active/inactive users

**Practice Results:**
- 15-20 practice results across users
- Scores ranging from 55% to 95%
- Various skills (Algebra, Geometry, Calculus)

**Invites:**
- 25 invites total (ensures K ≥ 1.20)
- Realistic funnel progression:
  - 20 opened (80% open rate)
  - 16 accepted (64% accept rate)
  - 14 FVM reached (56% FVM rate)
- K-factor calculation: (25/10) × (14/25) = 2.5 × 0.56 = **1.4 ✅**

**Analytics Counters:**
- Pre-populate counters collection with seed data totals

### 9.3 Seed Script Location
**File:** `scripts/seed-demo-data.ts`

**Run:** Once before demo, or use reset button in dev mode

**Reference:** See [PRD_seed_data.md](./MVP_PRDs/PRD_seed_data.md) for detailed specifications

---

## 10. Future Phases (Post-MVP)

### Phase 2: Additional Viral Loops
- Streak Rescue (Student → Student)
- Achievement Spotlight (Any persona)

### Phase 3: Additional Agents
- Personalization Agent (copy variants)
- Experimentation Agent (A/B testing)
- Social Presence Agent (real-time presence)

### Phase 4: Multi-Persona
- Parent persona (Proud Parent loop)
- Tutor persona (Tutor Spotlight loop)

### Phase 5: Advanced Features
- Real-time presence ("28 peers practicing Algebra now")
- Leaderboards per subject
- Activity feeds
- Real session transcription integration

---

## 10. Risk & Compliance

### 10.1 Risks

**Technical:**
- Firestore query limitations for complex analytics (mitigation: start simple, migrate to Supabase if needed)
- Cold starts on API routes (mitigation: Next.js API routes avoid cold starts vs Cloud Functions)

**Product:**
- Low K-factor if users don't engage (mitigation: test with seed users, iterate on copy/UX)
- Spam/abuse if rate limits too loose (mitigation: strict rate limiting, monitoring)

### 10.2 Compliance

**Data Privacy:**
- No PII in share cards
- User data stored in Firestore (encrypted at rest)
- Attribution tracking via short codes (no personal data in URLs)

**Rate Limiting:**
- Prevents spam/abuse
- Protects user experience

**Auditability:**
- All Orchestrator decisions logged with rationale
- Full funnel tracking (sent → opened → accepted → FVM)

---

## Appendix A: Glossary

- **K-Factor**: Viral coefficient measuring how many new users each user brings (K = invites/user × conversion rate)
- **FVM**: First Value Moment - when a new user completes their first valuable action (challenge completion)
- **Orchestrator**: AI agent that decides when to trigger viral loops
- **Smart Link**: Short URL (vt.ly/abc123) with attribution tracking
- **Session Intelligence**: System that analyzes practice results and generates challenges automatically
- **Share Card**: Privacy-safe image/card that users share when inviting friends

---

## Appendix B: Decision Log Examples

**Example 1: Trigger Decision**
```json
{
  "decision": "trigger_buddy_challenge",
  "rationale": "User scored 78% on practice test, 1/3 invites used today, last invite 2 hours ago",
  "features_used": ["practice_score", "invite_count_today", "last_invite_timestamp"],
  "timestamp": "2025-01-21T10:30:00Z"
}
```

**Example 2: Skip Decision (Rate Limit)**
```json
{
  "decision": "skip",
  "rationale": "User has sent 3/3 invites today (rate limit reached)",
  "features_used": ["invite_count_today"],
  "timestamp": "2025-01-21T14:15:00Z"
}
```

---

**Document Status:** Ready for Implementation  
**Last Updated:** 2025-01-21  
**Next Review:** After MVP completion


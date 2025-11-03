# System Patterns: Architecture & Design Decisions

**Last Updated:** 2025-01-21

---

## Architecture Overview

### High-Level Architecture

```
Frontend (Next.js + Tailwind)
  ↓ HTTP API Calls
Backend (Next.js API Routes)
  ├── Loop Orchestrator Agent
  ├── Session Intelligence Service
  ├── Attribution Service
  └── Reward Service
  ↓ Database Queries
Database (Firebase Firestore)
```

### Component Layers

1. **Frontend Layer**: React components, pages, routing
2. **API Layer**: Next.js API routes handling HTTP requests
3. **Agent Layer**: TypeScript classes making intelligent decisions
4. **Service Layer**: Business logic for attribution, rewards, etc.
5. **Data Layer**: Firestore collections for persistence

---

## Agent Architecture Pattern

### Core Pattern: Decision-Making Agents

Agents are TypeScript classes that:
- Take context as input (user, event, data)
- Apply decision logic (rules-based for MVP)
- Return structured decisions with rationale
- Log all decisions for auditability

### Loop Orchestrator Agent

**Purpose**: Decides when to trigger viral loop prompts

**Structure**:
```typescript
class LoopOrchestrator {
  async decide(userId: string, event: Event): Promise<AgentDecision> {
    // Eligibility checks
    // Decision logic
    // Log decision
    return { shouldTrigger, rationale, features_used };
  }
  
  async logDecision(decision: AgentDecision, context: DecisionContext): Promise<void>;
}
```

**Decision Factors**:
- Practice test completed? ✅
- Invites today < 3? ✅
- Last invite > 1 hour ago? ✅
- Score ≥ 50%? ✅

**Audit Logging**:
- Every decision logged to `decisions` collection
- Includes: rationale, features used, timestamp
- Queryable for debugging and analysis

### Agent Interface Pattern

```typescript
interface AgentDecision {
  shouldTrigger: boolean;
  rationale: string;
  loopType?: string;
  features_used: string[];
}

interface Agent {
  decide(context: AgentContext): Promise<AgentDecision>;
  logDecision(decision: AgentDecision): Promise<void>;
}
```

**Benefits**:
- Extensible: Easy to add new agents
- Testable: Pure decision logic
- Auditable: All decisions logged
- Explainable: Rationale for every decision

---

## Data Flow Patterns

### Viral Loop Flow

```
User Event (practice_completed)
  ↓
API Route (POST /api/practice/complete)
  ↓
Save Practice Result
  ↓
Basic Eligibility Check (score ≥50%)
  ↓
Return: { resultId, score, shouldShowInvite: boolean }
  ↓
Frontend shows "Challenge Friend" button (if shouldShowInvite = true)
  ↓
User Clicks "Challenge Friend" Button
  ↓
API Route (POST /api/invite/create)
  ↓
Call Orchestrator (POST /api/orchestrator/decide) - FINAL DECISION
  ↓
Orchestrator Checks Eligibility (rate limits, cooldown)
  ↓
Log Decision
  ↓
If shouldTrigger:
  → Generate challenge (Session Intelligence)
  → Create invite record
  → Update analytics counters (invites_sent +1)
  → Return shareUrl + shareCard
Else:
  → Return error (rate_limit_exceeded, cooldown_period, score_too_low)
```

### Invite Creation Flow

```
User Clicks "Challenge Friend"
  ↓
API Route (POST /api/invite/create)
  ↓
Session Intelligence: Generate Challenge
  ├── Analyze skill gaps
  ├── Select 5 questions
  └── Generate share copy
  ↓
Attribution Service: Create Smart Link
  ├── Generate short code
  ├── Create invite record
  └── Return share URL
  ↓
Return shareUrl + shareCard to frontend
```

### Challenge Completion Flow

```
Friend Clicks Link (vt.ly/abc123)
  ↓
API Route (GET /api/invite/:shortCode)
  ├── Log opened_at
  └── Return challenge preview
  ↓
Friend Accepts (POST /api/invite/:code/accept)
  ├── Create/authenticate user
  ├── Log invitee_id
  └── Return challenge
  ↓
Friend Completes Quiz (POST /api/challenge/complete)
  ├── Calculate score
  ├── Log fvm_reached_at
  ├── Distribute rewards (both users)
  └── Update analytics
```

---

## Database Schema Patterns

### Collection Structure

**Users Collection**:
```typescript
{
  id: string;
  email: string;
  name: string;
  xp: number;
  created_at: timestamp;
}
```

**Practice Results Collection**:
```typescript
{
  id: string;
  user_id: string;
  score: number;              // 0-100
  skill_gaps: string[];       // ["Algebra", "Geometry"]
  completed_at: timestamp;
}
```

**Invites Collection** (Core viral tracking):
```typescript
{
  id: string;
  short_code: string;         // "abc123"
  inviter_id: string;
  loop_type: string;          // "buddy_challenge"
  practice_result_id: string;  // Reference to practice result
  
  // Funnel tracking (all nullable timestamps)
  created_at: timestamp;       // Sent
  opened_at: timestamp?;       // Opened
  invitee_id: string?;          // Accepted
  accepted_at: timestamp?;      // Accepted (timestamp)
  fvm_reached_at: timestamp?;  // FVM Reached
  
  // Challenge data (embedded, no separate collection)
  challenge_data: {
    skill: string;
    questions: Question[];
    share_copy: string;
    inviter_name: string;      // First name only
    inviter_score: number;
  };
}
```

**Decisions Collection** (Orchestrator audit log):
```typescript
{
  id: string;
  user_id: string;
  event_type: string;        // "invite_requested"
  decision: string;          // "trigger_buddy_challenge" | "skip"
  rationale: string;        // Human-readable explanation
  features_used: string[];    // ["practice_score", "invite_count_today"]
  created_at: timestamp;
}
```

**Analytics Counters Collection** (Pre-calculated metrics):
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

**Note**: Counters are updated on each event (write-time), not queried (read-time). This eliminates complex Firestore queries and ensures fast analytics dashboard loads.

### Indexing Strategy

**Critical Indexes**:
- `invites.short_code` (unique) - Fast link resolution
- `invites.inviter_id + created_at` - Fast daily count queries (for Orchestrator)
- `invites.created_at` - Time-based analytics (future: cohort filtering)
- `decisions.user_id + created_at` - Audit trail queries

**Analytics Optimization**:
- No indexes needed for `analytics_counters` (single document read)
- Pre-calculated counters eliminate need for complex aggregation queries

---

## Smart Link & Attribution Pattern

### Short Code Generation

**Format**: `vt.ly/[shortCode]` where shortCode is 6-8 alphanumeric characters

**Requirements**:
- Unique per invite
- URL-safe
- Case-insensitive
- Non-guessable (not sequential)

**Implementation**:
```typescript
function generateShortCode(): string {
  // Generate random 6-8 char code
  // Check uniqueness in database
  // Return code
}
```

### Attribution Tracking

**Funnel Stages** (all logged as timestamps):
1. **Sent**: `created_at` - Invite created
2. **Opened**: `opened_at` - Link clicked
3. **Accepted**: `invitee_id` set - User signed up
4. **FVM Reached**: `fvm_reached_at` - Challenge completed

**Attribution Logic**:
- Last-touch attribution for join (`invitee_id`)
- Multi-touch data stored for analysis
- Full funnel visibility for optimization

---

## Session Intelligence Pattern

### Challenge Generation Flow

```
Practice Result Input
  ↓
Skill Gap Analysis
  ├── Extract skill_gaps array
  └── Identify weakest skill (first in array for MVP)
  ↓
Question Selection
  ├── Query question bank by skill
  ├── Select 5 questions
  └── Ensure variety (no duplicates)
  ↓
Share Copy Generation
  ├── Analyze score (high/medium/low)
  ├── Select template
  └── Personalize with skill + score
  ↓
Return Challenge Object
```

### Personalization Logic

**Score-Based Copy Variants**:
- **High (≥80%)**: "I just crushed [Skill] with [Score]%! Think you can beat me? 😎"
- **Medium (60-79%)**: "I got [Score]% on [Skill]. Can you do better?"
- **Low (50-59%)**: "[Skill] is tough! I got [Score]%. Want to practice together?"

**Privacy Constraints**:
- First name only
- No email, user ID, or profile photo
- Generic skill names (not specific topics if sensitive)

---

## K-Factor Calculation Pattern

### Calculation Flow (MVP - Pre-Calculated Counters)

```
1. Read analytics_counters document (single read)
   ↓
2. Get total_users count (simple count query)
   ↓
3. Calculate:
   - Invites per User = total_invites_sent / total_users
   - Conversion Rate = total_fvm_reached / total_invites_sent
   - K-Factor = Invites per User × Conversion Rate
```

### Formula

```typescript
const counters = await db.collection('analytics_counters').doc('main').get();
const totalUsers = await db.collection('users').count().get(); // Simple count

const invitesPerUser = counters.total_invites_sent / totalUsers;
const conversionRate = counters.total_fvm_reached / counters.total_invites_sent;
const kFactor = invitesPerUser * conversionRate;
```

**Target**: K ≥ 1.20

**MVP Note**: Using "All Time" metrics (not 14-day cohort) for simplicity. Pre-calculated counters updated on each event (invite sent, opened, accepted, FVM reached) ensure fast dashboard loads without complex queries.

### Counter Update Events

- **Invite Sent**: `POST /api/invite/create` → `total_invites_sent +1`
- **Invite Opened**: `GET /api/invite/:shortCode` → `total_invites_opened +1` (if not already logged)
- **Invite Accepted**: `POST /api/invite/:code/accept` → `total_invites_accepted +1`
- **FVM Reached**: `POST /api/challenge/complete` → `total_fvm_reached +1`

---

## Error Handling Patterns

### Graceful Degradation

**Orchestrator Failure**:
- Default to `shouldTrigger: false`
- Log error for monitoring
- Show default copy if needed (but don't enforce rate limits)

**Session Intelligence Failure**:
- Use generic questions from fallback skill
- Use default share copy
- Continue flow (don't block invite creation)

**Database Failure**:
- Return conservative decision (skip)
- Log error
- Alert monitoring system

### Fallback Strategies

```typescript
// Try agent decision
try {
  const decision = await orchestrator.decide(userId, event);
  return decision;
} catch (error) {
  // Graceful fallback
  console.error("Orchestrator failed", error);
  return {
    shouldTrigger: false,
    rationale: "System error, defaulting to skip",
    features_used: ["error_fallback"]
  };
}
```

---

## API Route Patterns

### Request/Response Structure

**Standard Response**:
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

**Error Responses**:
- 400: Invalid request
- 404: Resource not found
- 429: Rate limit exceeded
- 500: Server error

### Internal Service Calls

**Pattern**: Agents/services called internally, not as HTTP endpoints

**Example**:
```typescript
// In API route
const orchestrator = new LoopOrchestrator(db);
const decision = await orchestrator.decide(userId, event);
// Use decision in response
```

---

## Testing Patterns ✅

### Test Infrastructure

**Stack**:
- **Vitest**: Unit and integration tests (fast, TypeScript-friendly)
- **Playwright**: E2E tests (browser automation)
- **Firebase Emulator**: Local Firestore testing (isolated)

**Test Structure**:
```
__tests__/
├── helpers/          # Setup and utilities
├── unit/             # Unit tests (46 tests passing)
│   └── utils/        # Utility function tests
└── integration/      # API route tests (Phase 3+)
```

### Unit Test Structure ✅

**Utility Tests** (46 tests, 100% coverage):
- ✅ K-factor calculation (7 tests)
- ✅ Score calculation (6 tests)
- ✅ Skill gap identification (4 tests)
- ✅ Share copy generation (8 tests)
- ✅ Short code generation (7 tests)
- ✅ Timestamp utilities (7 tests)
- ✅ Eligibility checks (7 tests)

**Best Practices**:
- Fast tests (<100ms each)
- Isolated tests (no dependencies)
- Edge case coverage (zero, empty, boundaries)
- Clear test names describing behavior

### Integration Test Structure (Ready)

**Agent Tests** (Phase 4+):
- Test decision logic with various inputs
- Test eligibility rules (rate limits, thresholds)
- Test logging functionality

**Service Tests** (Phase 4+):
- Test challenge generation
- Test attribution tracking
- Test reward distribution

**API Route Tests** (Phase 3+):
- Test practice completion endpoint
- Test invite creation endpoint
- Test analytics endpoint

### E2E Test Structure (Ready)

**End-to-End Flows** (Phase 3-7):
- Complete practice test → Orchestrator → Invite creation
- Link click → Acceptance → Challenge completion
- Verify all timestamps logged correctly
- Analytics dashboard displays correctly

**E2E Best Practices**:
- Use seed data for consistency
- Test critical paths only
- Fast execution (<30s per test)
- Screenshot on failure

---

## Performance Optimization Patterns

### Caching Strategy

**Question Bank**: Cache in memory (load once at startup)
**Invite Counts**: Cache for 5 minutes (refresh on new invite)
**Analytics**: Cache for 30 seconds (manual refresh button)

### Query Optimization

- Use Firestore indexes for frequent queries
- Batch related queries where possible
- Limit time windows for analytics (don't query all-time)

### Response Time Targets

- Orchestrator decision: <150ms
- API responses (p95): <500ms
- Smart link resolution: <500ms
- Analytics query: <1s

---

## Security Patterns

### Privacy-Safe Sharing

- **Share Cards**: First name only, no PII
- **URLs**: No user data in query params
- **Logging**: No PII in decision logs

### Rate Limiting

- **Daily Limit**: 3 invites per user per day
- **Cooldown**: 1 hour between invites
- **Enforcement**: Orchestrator checks before allowing invite

### Input Validation

- Validate all API inputs
- Sanitize user-generated content
- Type-check with TypeScript

---

## Future Architecture Patterns

### Multi-Agent System

```
Event → Orchestrator
  ↓
Orchestrator → Personalization Agent (copy variants)
Orchestrator → Experimentation Agent (A/B testing)
  ↓
Personalized Decision Returned
```

### Real-Time Features

```
WebSocket Connection
  ↓
Social Presence Agent
  ↓
Publish Presence Updates
  ↓
Frontend Updates UI
```

### Full MCP Protocol

- JSON schema contracts between agents
- Standardized agent communication
- Tool calling and resource access

---

## Key Design Decisions

### Why Next.js API Routes (not Cloud Functions)?

- **No cold starts** (<50ms vs 2-5s)
- **Agents in memory** (can hold class instances)
- **Simpler local dev** (no emulators)
- **Single repo** (frontend + backend)

### Why Firebase Firestore (not Postgres)?

- **Team familiarity** (faster MVP)
- **Real-time subscriptions** (ready for future features)
- **Serverless scaling**
- **Trade-off**: Complex analytics queries harder (but MVP metrics are simple)

### Why Single Agent in MVP?

- **Demonstrates pattern** (foundational architecture)
- **Most critical** (controls all loops)
- **Clean logging** (shows auditability)
- **Extensible** (can add more agents later)

### Why Buddy Challenge Loop Only?

- **Simplest to implement** (student → student)
- **Clear trigger** (practice test completion)
- **Measurable K-factor**
- **Self-contained** (no real-time coordination needed)

---

**Architecture Status**: Patterns defined, ready for implementation  
**Next**: Begin building with these patterns in mind


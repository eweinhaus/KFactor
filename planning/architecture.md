# System Architecture
## 10x K-Factor Viral Growth System - MVP

**Version:** 1.0  
**Date:** 2025-01-21

---

## Architecture Overview

This document describes the system architecture for the MVP viral growth system. The architecture prioritizes simplicity, speed of development, and clear separation of concerns while demonstrating the agent-oriented thinking required by the project.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js App<br/>TypeScript + Tailwind CSS]
        P1[/practice<br/>Practice Test]
        P2[/results/:id<br/>Results Page]
        P3[/invite/:code<br/>Challenge Landing]
        P4[/challenge/:id<br/>Take Challenge]
        P5[/analytics<br/>K-Factor Dashboard]
    end
    
    subgraph "API Layer - Next.js API Routes"
        API[API Router]
        ORCH[Loop Orchestrator Agent]
        SESSION[Session Intelligence]
        ATTR[Attribution Service]
        REWARD[Reward Service]
    end
    
    subgraph "Data Layer"
        DB[(Firebase Firestore)]
        USERS[users Collection]
        RESULTS[practice_results Collection]
        INVITES[invites Collection<br/>challenge_data embedded]
        DECISIONS[decisions Collection]
        COUNTERS[analytics_counters<br/>Pre-calculated metrics]
    end
    
    UI --> P1 & P2 & P3 & P4 & P5
    P1 & P2 & P3 & P4 & P5 -->|HTTP| API
    API --> ORCH & SESSION & ATTR & REWARD
    ORCH -->|Log Decisions| DECISIONS
    SESSION -->|Store Challenges| CHALLENGES
    ATTR -->|Track Invites| INVITES
    REWARD -->|Update Users| USERS
    API -->|Query/Write| DB
    DB --> USERS & RESULTS & INVITES & DECISIONS & CHALLENGES
```

---

## Component Architecture

### Frontend Components

```mermaid
graph LR
    subgraph "Pages"
        A[Practice Test Page] --> B[Results Page]
        B --> C[Challenge Button]
        C --> D[Share Modal]
        E[Invite Landing] --> F[Challenge Page]
        G[Analytics Dashboard]
    end
    
    subgraph "Components"
        H[PracticeQuestion]
        I[ResultsDisplay]
        J[ShareCard]
        K[ChallengeQuiz]
        L[AnalyticsMetrics]
    end
    
    A --> H
    B --> I
    D --> J
    F --> K
    G --> L
```

---

## Data Flow Architecture

### Complete Viral Loop Flow

```mermaid
sequenceDiagram
    participant U as User (Alex)
    participant FE as Frontend
    participant API as API Routes
    participant ORCH as Orchestrator Agent
    participant SI as Session Intelligence
    participant ATTR as Attribution Service
    participant DB as Firestore
    
    U->>FE: Complete practice test
    FE->>API: POST /api/practice/complete
    API->>DB: Save practice_results
    API-->>FE: {resultId, score, shouldShowInvite}
    FE->>U: Show results + "Challenge Friend" button
    
    Note over FE,API: Orchestrator NOT called here
    
    U->>FE: Click "Challenge Friend"
    FE->>API: POST /api/invite/create
    API->>ORCH: POST /api/orchestrator/decide
    ORCH->>DB: Query invite_count, last_invite
    ORCH->>DB: Log decision
    ORCH-->>API: {shouldTrigger: true, rationale}
    API->>SI: generateChallenge(result)
    SI->>DB: Query skill bank (in-memory)
    SI-->>API: {skill, questions, share_copy}
    API->>ATTR: generateSmartLink(userId, challenge)
    ATTR->>DB: Create invite record
    ATTR->>DB: Update analytics_counters (invites_sent +1)
    ATTR-->>API: {shortCode, shareUrl}
    API-->>FE: {shareUrl, shareCard}
    FE->>U: Display share link
    
    Note over U,DB: User shares link with friend (Sam)
    
    participant S as Friend (Sam)
    S->>FE: Click invite link
    FE->>API: GET /api/invite/:shortCode
    API->>DB: Log opened_at (if not already), Update counters (invites_opened +1)
    API->>DB: Return invite data
    API-->>FE: {inviter, challenge}
    FE->>S: Show landing page
    
    S->>FE: Accept challenge (sign up)
    FE->>API: POST /api/invite/:code/accept
    API->>DB: Create user, Log invitee_id, Update counters (invites_accepted +1)
    API-->>FE: {challenge}
    FE->>S: Show challenge page
    
    S->>FE: Complete challenge
    FE->>API: POST /api/challenge/complete
    API->>DB: Log fvm_reached_at, Update XP for both users
    API->>DB: Update counters (fvm_reached +1)
    API-->>FE: {score, reward}
    FE->>S: Show success + reward
    
    Note over API,DB: Analytics counters updated on each event (write-time)
```

---

## Agent Architecture

### Loop Orchestrator Agent

```mermaid
graph TD
    START[Event Received] --> CHECK1{Test<br/>Completed?}
    CHECK1 -->|No| SKIP1[Skip: No practice completion]
    CHECK1 -->|Yes| CHECK2{Invites Today<br/>< 3?}
    CHECK2 -->|No| SKIP2[Skip: Rate limit reached]
    CHECK2 -->|Yes| CHECK3{Last Invite<br/>> 1hr ago?}
    CHECK3 -->|No| SKIP3[Skip: Cooldown period]
    CHECK3 -->|Yes| CHECK4{Score<br/>≥ 50?}
    CHECK4 -->|No| SKIP4[Skip: Score too low]
    CHECK4 -->|Yes| TRIGGER[Trigger: buddy_challenge]
    
    SKIP1 & SKIP2 & SKIP3 & SKIP4 --> LOG[Log Decision to DB]
    TRIGGER --> LOG
    
    LOG --> RETURN[Return Decision + Rationale]
```

### Decision Logging Structure

```mermaid
graph LR
    EVENT[User Event] --> ORCH[Orchestrator]
    ORCH --> DECISION{Decision Logic}
    DECISION --> LOG[Decision Log Entry]
    
    LOG --> FIELDS[Fields:<br/>- decision<br/>- rationale<br/>- features_used<br/>- timestamp]
    FIELDS --> DB[(decisions Collection)]
```

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ PRACTICE_RESULTS : has
    USERS ||--o{ INVITES : creates
    USERS ||--o{ DECISIONS : triggers
    INVITES ||--o| CHALLENGES : contains
    
    USERS {
        string id PK
        string email
        string name
        number xp
        timestamp created_at
    }
    
    PRACTICE_RESULTS {
        string id PK
        string user_id FK
        number score
        array skill_gaps
        timestamp completed_at
    }
    
    INVITES {
        string id PK
        string short_code UK
        string inviter_id FK
        string loop_type
        timestamp created_at
        timestamp opened_at
        string invitee_id FK
        timestamp fvm_reached_at
        json challenge_data
    }
    
    DECISIONS {
        string id PK
        string user_id FK
        string event_type
        string decision
        string rationale
        array features_used
        timestamp created_at
    }
    
    ANALYTICS_COUNTERS {
        string id PK
        number total_users
        number total_invites_sent
        number total_invites_opened
        number total_invites_accepted
        number total_fvm_reached
        timestamp last_updated
    }
```

---

## API Architecture

### API Endpoint Map

```mermaid
graph TD
    subgraph "Practice Flow"
        A[POST /api/practice/complete<br/>Returns: shouldShowInvite]
    end
    
    subgraph "Invite Flow"
        B[POST /api/invite/create<br/>Calls Orchestrator] --> C[GET /api/invite/:shortCode]
        C --> D[POST /api/invite/:code/accept]
    end
    
    subgraph "Challenge Flow"
        D --> E[POST /api/challenge/complete]
    end
    
    subgraph "Analytics"
        F[GET /api/analytics<br/>Reads counters]
    end
    
    A --> B
    E --> F
```

---

## Attribution Flow

### Smart Link Tracking

```mermaid
graph LR
    A[Invite Created] --> B[Short Code: abc123]
    B --> C[Smart Link: vt.ly/abc123]
    C --> D[Friend Clicks Link]
    D --> E[Log: opened_at]
    E --> F[Friend Signs Up]
    F --> G[Log: invitee_id]
    G --> H[Friend Completes Challenge]
    H --> I[Log: fvm_reached_at]
    I --> J[Calculate K-Factor]
```

---

## K-Factor Calculation Flow (Pre-Calculated Counters)

### Analytics Pipeline

```mermaid
graph TD
    START[Analytics Request] --> FETCH[Read Counters + User Count]
    
    FETCH --> COUNTERS[analytics_counters.main]
    FETCH --> USERS[Simple User Count]
    
    COUNTERS --> EXTRACT[Extract Metrics:<br/>invites_sent, fvm_reached]
    USERS --> CALC1[Invites per User<br/>= invites_sent / total_users]
    EXTRACT --> CALC3[Conversion Rate<br/>= fvm_reached / invites_sent]
    
    CALC1 --> K[K-Factor<br/>= Invites/User × Conversion]
    CALC3 --> K
    
    COUNTERS --> FUNNEL[Build Funnel Data<br/>from counters]
    FUNNEL --> RETURN[Return Metrics]
    
    style COUNTERS fill:#e1f5ff
    style FETCH fill:#fff4e1
```

---

## Technology Stack Details

### Frontend Stack

```
┌─────────────────────────────────────┐
│  Next.js 14+ (App Router)           │
│  ├─ TypeScript                      │
│  ├─ Tailwind CSS                    │
│  ├─ React Hook Form                 │
│  └─ Client-Side Routing             │
└─────────────────────────────────────┘
```

### Backend Stack

```
┌─────────────────────────────────────┐
│  Next.js API Routes                 │
│  ├─ TypeScript                      │
│  ├─ Agent Classes                   │
│  │  ├─ Loop Orchestrator           │
│  │  └─ Session Intelligence        │
│  └─ Service Modules                 │
│     ├─ Attribution Service          │
│     └─ Reward Service               │
└─────────────────────────────────────┘
```

### Data Stack

```
┌─────────────────────────────────────┐
│  Firebase Firestore                 │
│  ├─ Collections                     │
│  │  ├─ users                       │
│  │  ├─ practice_results            │
│  │  ├─ invites                     │
│  │  ├─ decisions                   │
│  │  └─ challenges                  │
│  └─ Indexes                         │
│     ├─ invites by short_code        │
│     └─ invites by inviter_id        │
└─────────────────────────────────────┘
```

---

## Agent Communication Pattern

### MCP-Inspired Architecture (Simplified for MVP)

```mermaid
graph TB
    EVENT[User Event] --> ORCH[Loop Orchestrator]
    ORCH --> DECISION{Decision}
    DECISION -->|Trigger| SI[Session Intelligence]
    DECISION -->|Skip| LOG1[Log Skip Decision]
    SI --> CHALLENGE[Generate Challenge]
    CHALLENGE --> ATTR[Attribution Service]
    ATTR --> INVITE[Create Invite]
    INVITE --> LOG2[Log Trigger Decision]
    
    style ORCH fill:#e1f5ff
    style SI fill:#fff4e1
    style ATTR fill:#e8f5e9
```

**Note:** Full MCP protocol with JSON schemas is planned for future phases. MVP uses simplified TypeScript interfaces.

### Agent Interface

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

---

## Error Handling & Graceful Degradation

### Fallback Strategy

```mermaid
graph TD
    TRY[Try Agent Decision] --> SUCCESS{Success?}
    SUCCESS -->|Yes| USE[Use Agent Result]
    SUCCESS -->|No| FALLBACK[Use Default]
    
    FALLBACK --> DEFAULT_COPY[Default Copy:<br/>"Challenge a Friend!"]
    FALLBACK --> DEFAULT_QUESTIONS[Generic Questions<br/>from Skill Bank]
    
    USE --> CONTINUE[Continue Flow]
    DEFAULT_COPY --> CONTINUE
    DEFAULT_QUESTIONS --> CONTINUE
```

---

## Security Architecture

### Privacy & Safety Layers

```mermaid
graph TD
    SHARE[Generate Share Card] --> CHECK[Privacy Check]
    CHECK --> REMOVE[Remove PII]
    REMOVE --> VALIDATE[Validate Content]
    VALIDATE --> SAFE[Privacy-Safe Card]
    
    INVITE[Create Invite] --> RATE[Rate Limit Check]
    RATE --> VALID[Valid?]
    VALID -->|No| BLOCK[Block Invite]
    VALID -->|Yes| ALLOW[Allow Invite]
    
    style SAFE fill:#c8e6c9
    style BLOCK fill:#ffcdd2
    style ALLOW fill:#c8e6c9
```

---

## Deployment Architecture

### Vercel Deployment

```mermaid
graph LR
    CODE[GitHub Repo] --> BUILD[Vercel Build]
    BUILD --> DEPLOY[Deploy to Vercel]
    DEPLOY --> CDN[Global CDN]
    CDN --> USERS[Users]
    
    DEPLOY --> FIREBASE[Firebase Firestore]
    FIREBASE --> API[API Routes]
    API --> CDN
```

---

## Performance Considerations

### Response Time Targets

| Component | Target | Notes |
|-----------|--------|-------|
| Orchestrator Decision | <150ms | Required by spec |
| API Response (p95) | <500ms | Excluding Orchestrator |
| Smart Link Resolution | <500ms | Database query + redirect |
| Analytics Query | <1s | Firestore aggregation |

### Optimization Strategies

- **Database Indexes**: Index `short_code`, `inviter_id`, `created_at` for fast queries
- **Caching**: Cache skill bank questions in memory
- **Lazy Loading**: Load challenge questions only when needed
- **Batch Operations**: Batch reward updates when possible

---

## Scalability Considerations (Future)

### Current (MVP)
- Single-region deployment
- No caching layer
- Direct Firestore queries
- Mock authentication

### Future (Production)
- Multi-region deployment
- Redis caching layer
- Firestore with Cloud Functions for heavy operations
- Firebase Auth with SSO
- Message queue for async operations
- Real-time presence via WebSockets

---

## Monitoring & Observability

### Logging Strategy

```mermaid
graph TD
    APP[Application] --> LOGS[Structured Logs]
    LOGS --> ORCH[Orchestrator Decisions]
    LOGS --> API[API Requests]
    LOGS --> ERR[Errors]
    
    ORCH --> AUDIT[Audit Trail]
    API --> METRICS[Metrics]
    ERR --> ALERTS[Alerts]
```

### Key Metrics to Track

1. **Orchestrator Metrics**
   - Decision latency (p50, p95, p99)
   - Trigger rate vs skip rate
   - Feature usage frequency

2. **Viral Loop Metrics**
   - Invites sent per user
   - Conversion rate at each funnel stage
   - K-factor by time period

3. **System Health**
   - API error rates
   - Database query performance
   - User experience metrics (time to FVM)

---

## Architecture Decisions

### Why Next.js API Routes (not Cloud Functions)?

**Decision:** Use Next.js API Routes for backend logic.

**Rationale:**
- No cold starts (<50ms response time vs 2-5s for Cloud Functions)
- Agents can be TypeScript classes held in memory
- Simpler local development (no emulators needed)
- Single repo for frontend + backend
- Easier debugging and testing

**Trade-offs:**
- Less "serverless" (but still scalable on Vercel)
- Less automatic scaling (but fine for MVP)

### Why Firebase Firestore (not Postgres/Supabase)?

**Decision:** Use Firestore for database.

**Rationale:**
- Developer familiarity (faster MVP)
- Real-time subscriptions ready for future features
- Serverless scaling
- Simple schema for MVP needs

**Trade-offs:**
- Complex analytics queries harder (but MVP metrics are simple)
- Can migrate to Supabase later if needed
- Vendor lock-in (acceptable for MVP)

### Why Single Agent (Orchestrator) in MVP?

**Decision:** Build only Loop Orchestrator agent in MVP.

**Rationale:**
- Demonstrates agent architecture pattern
- Most foundational (controls all loops)
- Clean decision logging shows auditability
- Can add more agents later

**Trade-offs:**
- No personalization (same copy for everyone - fine for MVP)
- No A/B testing (manual allocation later if needed)
- Simpler system = faster delivery

### Why Buddy Challenge Loop Only?

**Decision:** Build only Buddy Challenge viral loop in MVP.

**Rationale:**
- Simplest to implement (student → student, no parent/tutor complexity)
- Clear trigger (practice test completion)
- Measurable K-factor
- Self-contained (no real-time coordination needed)

**Trade-offs:**
- Only one loop (but proves the concept)
- Can add more loops after MVP

---

## Future Architecture Evolution

### Phase 2: Multi-Agent System

```mermaid
graph TB
    EVENT[User Event] --> ORCH[Orchestrator]
    ORCH --> PERSONALIZE[Personalization Agent]
    ORCH --> EXPERIMENT[Experimentation Agent]
    PERSONALIZE --> COPY[Personalized Copy]
    EXPERIMENT --> VARIANT[Test Variant]
    COPY --> TRIGGER[Trigger Loop]
    VARIANT --> TRIGGER
```

### Phase 3: Real-Time Features

```mermaid
graph TB
    USERS[Users] --> WS[WebSocket Server]
    WS --> PRESENCE[Social Presence Agent]
    PRESENCE --> FEED[Activity Feed]
    PRESENCE --> LEADERBOARD[Leaderboards]
```

### Phase 4: Full MCP Protocol

```mermaid
graph LR
    AGENT1[Agent 1] --> MCP[MCP Server]
    AGENT2[Agent 2] --> MCP
    AGENT3[Agent 3] --> MCP
    MCP --> JSON[JSON Schema Contracts]
    JSON --> COMM[Communication Layer]
```

---

## Glossary

- **Agent**: TypeScript class that makes decisions and logs rationale
- **Orchestrator**: Agent that decides when to trigger viral loops
- **Session Intelligence**: System that analyzes practice results and generates challenges
- **Smart Link**: Short URL with attribution tracking (vt.ly/abc123)
- **FVM**: First Value Moment - completion of challenge
- **K-Factor**: Viral coefficient = (invites/user) × (conversion rate)

---

**Document Status:** Architecture Design Complete  
**Last Updated:** 2025-01-21  
**Next Review:** After MVP Implementation


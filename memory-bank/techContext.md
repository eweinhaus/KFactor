# Technical Context: Technology Stack & Setup

**Last Updated:** 2025-01-21

---

## Technology Stack

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form
- **Routing**: Next.js file-based routing (no React Router needed)

### Backend

- **Framework**: Next.js API Routes
- **Language**: TypeScript
- **Agents**: TypeScript classes (in-memory instances)
- **Services**: TypeScript modules

### Database

- **Primary**: Firebase Firestore
- **Collections**:
  - `users` - User accounts
  - `practice_results` - Test completions
  - `invites` - Viral loop tracking (challenge_data embedded)
  - `decisions` - Orchestrator audit log
  - `analytics_counters` - Pre-calculated metrics (single document)

### Authentication (MVP)

- **MVP**: Mock auth (hardcoded users for speed)
- **Future**: Firebase Auth

### Deployment

- **Platform**: Vercel
- **Reason**: One-click deploy, perfect for Next.js, free tier generous
- **Environment**: Production + preview deployments per commit

---

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account (for Firestore)
- Git

### Initial Setup Commands

```bash
# Create Next.js app
npx create-next-app@latest kfactor --typescript --tailwind --app

# Install Firebase
npm install firebase firebase-admin

# Install additional dependencies
npm install react-hook-form
npm install recharts  # For analytics charts (future)

# Development server
npm run dev
```

### Project Structure

```
kfactor/
├── app/
│   ├── api/              # API routes
│   │   ├── practice/
│   │   ├── invite/
│   │   ├── challenge/
│   │   ├── orchestrator/
│   │   └── analytics/
│   ├── practice/         # Practice test page
│   ├── results/          # Results page
│   ├── invite/           # Invite landing page
│   ├── challenge/        # Challenge quiz page
│   ├── dashboard/        # User dashboard
│   └── analytics/        # Analytics dashboard
├── src/
│   ├── agents/           # Agent classes
│   │   └── LoopOrchestrator.ts
│   ├── services/         # Business logic
│   │   ├── sessionIntelligence.ts
│   │   ├── attribution.ts
│   │   └── rewards.ts
│   ├── lib/              # Utilities
│   │   ├── firebase.ts   # Firestore client
│   │   └── questionBank.ts
│   └── types/            # TypeScript types
├── public/                # Static assets
└── memory-bank/          # Project documentation
```

---

## Firebase Configuration

### Firestore Setup

**Collections Required**:
1. `users` - User accounts
2. `practice_results` - Practice test results
3. `invites` - Invite tracking (challenge_data embedded in each invite)
4. `decisions` - Orchestrator decisions (audit log)
5. `analytics_counters` - Pre-calculated metrics (single document: id="main")

**Indexes Required**:
- `invites.short_code` (unique)
- `invites.inviter_id + created_at` (composite)
- `invites.created_at` (ascending)
- `decisions.user_id + created_at` (composite)

### Firebase Admin SDK

**Server-Side (API Routes)**:
```typescript
// lib/firebase-admin.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      // Service account key
    })
  });
}

export const db = admin.firestore();
```

**Client-Side (Frontend)**:
```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your config
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

---

## API Route Structure

### Route Pattern

```
app/api/[endpoint]/route.ts
```

### Example: Practice Complete

```typescript
// app/api/practice/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LoopOrchestrator } from '@/src/agents/LoopOrchestrator';

export async function POST(req: NextRequest) {
  const { userId, answers } = await req.json();
  
  // Save practice result
  const result = await savePracticeResult(userId, answers);
  
  // Call orchestrator
  const orchestrator = new LoopOrchestrator(db);
  const decision = await orchestrator.decide(userId, {
    type: 'practice_completed',
    resultId: result.id,
    score: result.score
  });
  
  return NextResponse.json({
    resultId: result.id,
    score: result.score,
    shouldShowInvite: decision.shouldTrigger,
    shareLink: decision.shouldTrigger ? await createShareLink() : undefined
  });
}
```

---

## Type Definitions

### Core Types

```typescript
// User
interface User {
  id: string;
  email: string;
  name: string;
  xp: number;
  created_at: Timestamp;
}

// Practice Result
interface PracticeResult {
  id: string;
  user_id: string;
  score: number;              // 0-100
  skill_gaps: string[];
  completed_at: Timestamp;
}

// Invite
interface Invite {
  id: string;
  short_code: string;
  inviter_id: string;
  loop_type: string;
  created_at: Timestamp;
  opened_at?: Timestamp;
  invitee_id?: string;
  fvm_reached_at?: Timestamp;
  challenge_data: ChallengeData;
}

// Agent Decision
interface AgentDecision {
  shouldTrigger: boolean;
  rationale: string;
  loopType?: string;
  features_used: string[];
}

// Question
interface Question {
  id: string;
  text: string;
  options: string[];         // 4 options
  correctAnswer: number;     // Index 0-3
  skill: string;
}
```

---

## Development Workflow

### Local Development

1. **Start dev server**: `npm run dev`
2. **Firebase Emulator** (optional): Use Firestore emulator for local testing
3. **Hot Reload**: Next.js provides automatic refresh

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=  # Server-side only
```

### Testing Strategy ✅

- **Unit Tests**: Vitest (46 tests passing, 100% coverage on utilities)
  - K-factor calculation
  - Score calculation
  - Skill gap identification
  - Share copy generation
  - Short code generation
  - Timestamp utilities
  - Eligibility checks

- **Integration Tests**: Vitest + Firebase Emulator (ready)
  - API route testing
  - Database operations
  - Agent decision logic

- **E2E Tests**: Playwright (configured, ready for Phase 3+)
  - Complete viral loop flow
  - Analytics dashboard
  - Error handling scenarios

- **CI/CD**: GitHub Actions workflow configured
  - Automated test runs on push/PR
  - All tests passing

**Test Commands**:
```bash
npm run test          # Unit tests (watch)
npm run test:coverage # With coverage
npm run test:e2e      # E2E tests
npm run test:all      # All tests
npm run emulator      # Start Firebase emulator
```

---

## Performance Considerations

### Response Time Targets

- **Orchestrator Decision**: <150ms (required by spec)
- **API Responses (p95)**: <500ms
- **Smart Link Resolution**: <500ms
- **Analytics Query**: <1s

### Optimization Strategies

**Database**:
- Index critical queries
- Limit query results
- Cache frequent queries

**Code**:
- Cache question bank in memory
- Lazy load components
- Optimize bundle size (Tree shaking)

**Caching**:
- Client-side: Cache analytics for 30s
- Server-side: Cache invite counts for 5min

---

## Deployment Process

### Vercel Deployment

1. **Connect Repository**: Link GitHub repo to Vercel
2. **Environment Variables**: Set in Vercel dashboard
3. **Auto-Deploy**: Every push to main triggers deployment
4. **Preview URLs**: Every PR gets preview deployment

### Build Configuration

**vercel.json** (if needed):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Production Checklist

- [ ] Environment variables set
- [ ] Firestore indexes created
- [ ] Security rules configured
- [ ] Error tracking set up (future: Sentry)
- [ ] Analytics verified

---

## Database Schema Details

### Firestore Security Rules (Future)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Invites: read if you're inviter or invitee
    match /invites/{inviteId} {
      allow read: if request.auth != null && (
        resource.data.inviter_id == request.auth.uid ||
        resource.data.invitee_id == request.auth.uid
      );
      allow create: if request.auth != null;
    }
  }
}
```

**MVP Note**: Start with open rules for speed, add security later

---

## Agent Implementation Details

### Loop Orchestrator Class

```typescript
// src/agents/LoopOrchestrator.ts
import { db } from '@/lib/firebase-admin';

export class LoopOrchestrator {
  constructor(private db: FirebaseFirestore.Firestore) {}
  
  async decide(
    userId: string,
    event: { type: string; resultId: string; score: number }
  ): Promise<AgentDecision> {
    // Check eligibility
    const invitesToday = await this.getInviteCountToday(userId);
    const lastInvite = await this.getLastInviteTime(userId);
    
    // Decision logic
    if (invitesToday >= 3) {
      return this.logDecision({
        shouldTrigger: false,
        rationale: `Rate limit: ${invitesToday}/3 invites today`,
        features_used: ['invite_count_today']
      }, userId, event);
    }
    
    // ... more checks
    
    return this.logDecision({
      shouldTrigger: true,
      rationale: `Score ${event.score}%, ${invitesToday}/3 invites used`,
      loopType: 'buddy_challenge',
      features_used: ['practice_score', 'invite_count_today']
    }, userId, event);
  }
  
  private async logDecision(
    decision: AgentDecision,
    userId: string,
    event: any
  ): Promise<AgentDecision> {
    await this.db.collection('decisions').add({
      user_id: userId,
      event_type: event.type,
      decision: decision.shouldTrigger ? `trigger_${decision.loopType}` : 'skip',
      rationale: decision.rationale,
      features_used: decision.features_used,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return decision;
  }
}
```

---

## External Dependencies

### npm Packages

**Core**:
- `next`: Framework
- `react`: UI library
- `typescript`: Language
- `firebase`: Client SDK
- `firebase-admin`: Server SDK

**Utilities**:
- `react-hook-form`: Form handling
- `tailwindcss`: Styling
- `dotenv`: Environment variable loading
- `tsx`: TypeScript execution for scripts

**Testing**:
- `vitest`: Unit and integration testing
- `@vitest/ui`: Test UI interface
- `@vitest/coverage-v8`: Coverage reporting
- `@playwright/test`: E2E testing

### No External APIs

- No third-party services required
- All logic internal
- Firestore is only external service

---

## Development Best Practices

### Code Organization

- **Separation of Concerns**: Agents, services, and routes in separate modules
- **Type Safety**: Use TypeScript strictly
- **Error Handling**: Try-catch blocks with logging
- **Code Comments**: Document complex logic

### Git Workflow

- **Feature Branches**: One feature per branch
- **Commits**: Descriptive commit messages
- **PRs**: Review before merging to main

### Code Style

- **Formatting**: Prettier (auto-format)
- **Linting**: ESLint (Next.js config)
- **Type Checking**: TypeScript strict mode

---

## Known Technical Constraints

### Firestore Limitations

- **Complex Queries**: No JOINs (workaround: multiple queries)
- **Analytics**: Not designed for analytics (simple aggregations OK)
- **Future Consideration**: May migrate to Supabase/Postgres if analytics become complex

### Next.js API Routes

- **Stateless**: Can't hold persistent connections
- **Cold Starts**: Minimal (much better than Cloud Functions)
- **Scaling**: Handled by Vercel automatically

### MVP Simplifications

- **Mock Auth**: No real authentication (speed over security)
- **Hardcoded Questions**: Question bank in code (not database)
- **Simple Analytics**: Manual refresh (no real-time updates)

---

## Future Technical Enhancements

### Phase 2

- **Real Authentication**: Firebase Auth integration
- **Database Migration**: Consider Supabase for better analytics
- **Caching Layer**: Redis for frequently accessed data

### Phase 3

- **Real-Time Features**: WebSockets or Server-Sent Events
- **Background Jobs**: Queue system for async processing
- **Advanced Analytics**: Data warehouse for complex queries

### Phase 4

- **Multi-Region**: Global deployment
- **CDN**: Static asset optimization
- **Monitoring**: Error tracking, performance monitoring

---

**Technical Status**: Stack chosen, architecture defined, ready for implementation  
**Next**: Set up project structure and begin coding


# Phase 1: Project Foundation
**Goal:** Set up the development environment and database structure  
**Timeline:** Days 1-2 (8-12 hours)  
**Status:** Not Started

---

## Overview

Phase 1 establishes the technical foundation for the entire MVP. This phase includes:
- Next.js project initialization with TypeScript and Tailwind CSS
- Firebase Firestore configuration (both client and server SDKs)
- TypeScript type definitions for all data models
- Hardcoded question bank for practice tests and challenges

**Success Criteria:**
- ✅ Next.js project runs locally without errors
- ✅ Firebase connection works (client + server)
- ✅ All Firestore collections created and accessible
- ✅ TypeScript types compile without errors
- ✅ Question bank accessible via imports

---

## Task 1: Initialize Next.js Project

### Subtasks

1.1. **Create Next.js Application**
- Run: `npx create-next-app@latest kfactor --typescript --tailwind --app --no-git` (we'll init git separately)
- Verify: Project structure created correctly
- Test: `npm run dev` starts successfully

1.2. **Configure Project Structure**
- Create folder structure:
  ```
  app/
    api/              # API routes (created automatically)
  src/
    agents/           # Agent classes (LoopOrchestrator, etc.)
    services/         # Business logic (attribution, rewards, session intelligence)
    lib/              # Utilities (firebase configs, helpers)
    types/            # TypeScript type definitions
  scripts/            # Seed data and utility scripts
  ```
- Create placeholder files to establish structure:
  - `src/agents/.gitkeep`
  - `src/services/.gitkeep`
  - `src/lib/.gitkeep`
  - `src/types/.gitkeep`
  - `scripts/.gitkeep`

1.3. **Install Dependencies**
- Install Firebase packages:
  ```bash
  npm install firebase firebase-admin
  ```
- Install additional utilities (if needed):
  ```bash
  npm install react-hook-form  # For forms (future use)
  ```
- Verify: All packages install without errors

1.4. **Environment Variables Setup**
- Create `.env.local` file (add to `.gitignore`)
- Set up environment variable template:
  ```
  # Firebase Client Config
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
  NEXT_PUBLIC_FIREBASE_APP_ID=

  # Firebase Admin (Server-side only)
  FIREBASE_SERVICE_ACCOUNT_KEY=
  ```
- Create `.env.example` with placeholder values (no actual secrets)
- Document: Add setup instructions in README or memory bank

**Potential Pitfalls:**
- ❌ Don't commit `.env.local` to git (verify `.gitignore`)
- ❌ Don't over-structure folders (keep it simple, add as needed)
- ✅ Do test that `npm run dev` works before moving on
- ✅ Do verify Next.js version is 14+ (check `package.json`)

**Acceptance:**
- [ ] Next.js app runs on `localhost:3000`
- [ ] No TypeScript errors
- [ ] Folder structure matches above
- [ ] `.env.local` exists (even if empty)

---

## Task 2: Firebase Firestore Setup

### Subtasks

2.1. **Create Firebase Project**
- Create new Firebase project in Firebase Console
- Note: Project ID (will be used in env vars)
- Enable Firestore Database (start in production mode for MVP)

2.2. **Firebase Client SDK Configuration**
- Create `src/lib/firebase.ts`:
  ```typescript
  import { initializeApp } from 'firebase/app';
  import { getFirestore } from 'firebase/firestore';

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  export const db = getFirestore(app);
  ```
- Test: Import works without errors

2.3. **Firebase Admin SDK Configuration**
- Generate service account key:
  - Firebase Console → Project Settings → Service Accounts
  - Generate new private key
  - Save as JSON file (e.g., `firebase-service-account.json`)
  - Add to `.gitignore` (never commit!)
- Create `src/lib/firebase-admin.ts`:
  ```typescript
  import admin from 'firebase-admin';

  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  export const db = admin.firestore();
  ```
- Alternative: Store service account JSON in environment variable (safer for Vercel)

2.4. **Create Firestore Collections**
- Create collections in Firestore Console (or via script):
  - `users`
  - `practice_results`
  - `invites`
  - `decisions`
  - `analytics_counters`
- For `analytics_counters`: Create single document with `id: "main"`
- Verify: Collections visible in Firebase Console

2.5. **Set Up Firestore Indexes**
- Create composite indexes (via Firebase Console or `firestore.indexes.json`):
  - `invites`: Index on `short_code` (for fast lookups)
  - `invites`: Composite index on `inviter_id` + `created_at` (for daily count queries)
  - `invites`: Index on `created_at` (for time-based queries)
  - `decisions`: Composite index on `user_id` + `created_at` (for audit trail)
- Note: Firebase will auto-create single-field indexes, but composite indexes must be created manually

**Potential Pitfalls:**
- ❌ Don't commit service account JSON file to git
- ❌ Don't use production Firestore rules initially (start open, add security later)
- ❌ Don't create too many indexes upfront (only create what's needed)
- ✅ Do test both client and admin SDK connections
- ✅ Do verify collections are accessible from code

**Acceptance:**
- [ ] Client SDK connects successfully
- [ ] Admin SDK connects successfully (test with a simple read)
- [ ] All 5 collections exist in Firestore
- [ ] `analytics_counters` has document with `id: "main"`
- [ ] At least one index created and verified

---

## Task 3: Type Definitions

### Subtasks

3.1. **Create Core Type Definitions File**
- Create `src/types/index.ts`
- Define all interfaces based on PRD_MVP.md data models

3.2. **Define User Types**
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  xp: number;
  created_at: Timestamp;
}
```

3.3. **Define Practice Result Types**
```typescript
export interface PracticeResult {
  id: string;
  user_id: string;
  score: number;              // 0-100
  skill_gaps: string[];       // ["Algebra", "Geometry"]
  completed_at: Timestamp;
}
```

3.4. **Define Invite Types**
```typescript
export interface Invite {
  id: string;
  short_code: string;         // "abc123"
  inviter_id: string;
  loop_type: string;          // "buddy_challenge"
  practice_result_id?: string; // Reference to practice result
  
  // Funnel tracking
  created_at: Timestamp;
  opened_at?: Timestamp;
  invitee_id?: string;
  accepted_at?: Timestamp;
  fvm_reached_at?: Timestamp;
  
  // Challenge data (embedded)
  challenge_data: ChallengeData;
}

export interface ChallengeData {
  skill: string;
  questions: Question[];
  share_copy: string;
  inviter_name: string;       // First name only
  inviter_score: number;
}
```

3.5. **Define Decision Types**
```typescript
export interface Decision {
  id: string;
  user_id: string;
  event_type: string;         // "practice_completed" | "invite_requested"
  event_id?: string;          // ID of practice result or invite
  decision: string;           // "trigger_buddy_challenge" | "skip"
  rationale: string;
  features_used: string[];
  context?: {
    score?: number;
    invites_today?: number;
    last_invite_hours_ago?: number;
  };
  created_at: Timestamp;
}
```

3.6. **Define Analytics Types**
```typescript
export interface AnalyticsCounters {
  id: string;                 // "main"
  total_users: number;
  total_invites_sent: number;
  total_invites_opened: number;
  total_invites_accepted: number;
  total_fvm_reached: number;
  last_updated: Timestamp;
}
```

3.7. **Define Question Types**
```typescript
export interface Question {
  id: string;
  text: string;
  options: string[];          // 4 options
  correctAnswer: number;      // Index 0-3
  skill: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface Answer {
  questionId: string;
  selectedAnswer: number;    // Index 0-3
}
```

3.8. **Define API Request/Response Types**
```typescript
// Practice Complete
export interface PracticeCompleteRequest {
  userId: string;
  answers: Answer[];
}

export interface PracticeCompleteResponse {
  resultId: string;
  score: number;
  skillGaps: string[];
  shouldShowInvite: boolean;
}

// Invite Create
export interface InviteCreateRequest {
  userId: string;
  resultId: string;
}

export interface InviteCreateResponse {
  shortCode: string;
  shareUrl: string;
  shareCard: ShareCard;
}

export interface ShareCard {
  text: string;
  inviterName: string;
  score: number;
  skill: string;
}

// Agent Decision
export interface AgentDecision {
  shouldTrigger: boolean;
  rationale: string;
  loopType?: string;
  features_used: string[];
}
```

3.9. **Define Timestamp Helper Type**
```typescript
// Use Firestore Timestamp type
import { Timestamp } from 'firebase/firestore';
export type { Timestamp };
```

**Potential Pitfalls:**
- ❌ Don't over-complicate types (keep them simple, match PRD exactly)
- ❌ Don't use `any` types (use proper TypeScript types)
- ❌ Don't forget optional fields (use `?` where appropriate)
- ✅ Do export all types for easy imports elsewhere
- ✅ Do use Firestore's `Timestamp` type (not Date)

**Acceptance:**
- [ ] All types defined without errors
- [ ] Types match PRD_MVP.md specifications
- [ ] TypeScript compiles successfully (`npm run build`)
- [ ] Types are exported and importable

---

## Task 4: Question Bank

### Subtasks

4.1. **Create Question Bank File**
- Create `src/lib/questionBank.ts`
- Structure: Export object with skills as keys

4.2. **Define Question Bank Structure**
```typescript
import { Question } from '@/types';

export const QUESTION_BANK: Record<string, Question[]> = {
  "Algebra": [...],
  "Geometry": [...],
  "Calculus": [...],
  // Add more skills as needed
};
```

4.3. **Create Algebra Questions (Minimum 10-15)**
- Create realistic multiple-choice questions
- Format: 4 options per question
- Mark correct answer with index (0-3)
- Example:
```typescript
{
  id: "alg_1",
  text: "Solve for x: 2x + 5 = 13",
  options: ["x = 4", "x = 6", "x = 9", "x = 18"],
  correctAnswer: 0,
  skill: "Algebra",
  difficulty: "easy"
}
```

4.4. **Create Geometry Questions (Minimum 10-15)**
- Similar format to Algebra
- Focus on geometry concepts

4.5. **Create Calculus Questions (Minimum 10-15)**
- Similar format
- Focus on calculus basics

4.6. **Verify Question Bank**
- Test import: `import { QUESTION_BANK } from '@/lib/questionBank'`
- Verify structure: All questions have required fields
- Count questions: At least 10 per skill (minimum), 15 preferred

**Potential Pitfalls:**
- ❌ Don't create too many questions (10-15 per skill is enough for MVP)
- ❌ Don't use complex questions (keep them simple for MVP)
- ❌ Don't forget to mark correct answers (test that scoring works)
- ✅ Do use clear, unambiguous questions
- ✅ Do ensure questions are appropriate for target age (grades 6-12)
- ✅ Do test that questions can be imported and accessed

**Acceptance:**
- [ ] Question bank file created
- [ ] At least 3 skills defined (Algebra, Geometry, Calculus minimum)
- [ ] Minimum 10 questions per skill (15 preferred)
- [ ] All questions have: id, text, options (4), correctAnswer, skill
- [ ] Question bank imports without errors
- [ ] Questions accessible via `QUESTION_BANK["Algebra"]`

---

## Verification Checklist

Before moving to Phase 2, verify:

- [ ] Next.js project runs: `npm run dev` → localhost:3000 works
- [ ] Firebase client SDK: Can connect from frontend code
- [ ] Firebase admin SDK: Can connect from API routes
- [ ] Firestore collections: All 5 collections exist and are accessible
- [ ] TypeScript compilation: `npm run build` succeeds without errors
- [ ] Type definitions: All types importable and match PRD specs
- [ ] Question bank: At least 30 questions total (10 per skill × 3 skills)
- [ ] Environment variables: `.env.local` configured (even if values are placeholders)
- [ ] Git: Repository initialized, `.gitignore` includes `.env.local` and service account files

---

## Potential Pitfalls & Mitigations

### Pitfall 1: Firebase Configuration Confusion
**Issue:** Mixing up client vs server SDK configuration  
**Mitigation:** 
- Client SDK: `src/lib/firebase.ts` uses `NEXT_PUBLIC_*` env vars
- Admin SDK: `src/lib/firebase-admin.ts` uses service account key
- Document clearly which one to use where

### Pitfall 2: Firestore Security Rules Too Restrictive
**Issue:** Starting with production security rules blocks development  
**Mitigation:** Start with open rules for MVP:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Open for MVP
    }
  }
}
```
Add security later (Phase 9 or post-MVP)

### Pitfall 3: Type Definition Drift
**Issue:** Types don't match actual Firestore schema  
**Mitigation:** 
- Match types exactly to PRD_MVP.md
- Use Firestore `Timestamp` type (not JavaScript `Date`)
- Test types with actual database reads/writes

### Pitfall 4: Question Bank Not Scalable
**Issue:** Hardcoded questions make future updates difficult  
**Mitigation:** 
- Structure questions clearly (easy to add/remove)
- Consider moving to database in Phase 2+ if needed
- For MVP, hardcoded is fine and faster

### Pitfall 5: Missing Environment Variables
**Issue:** App crashes because env vars not set  
**Mitigation:** 
- Create `.env.example` with all required vars
- Add validation in firebase config files
- Document setup in README or memory bank

---

## Dependencies

**External:**
- Firebase account and project
- Node.js 18+ installed
- npm/yarn package manager

**Internal:**
- None (this is the foundation phase)

---

## Next Steps (Phase 2)

After completing Phase 1, proceed to:
- **Phase 2: Seed Data** - Populate demo data (10 users, 25 invites, K≥1.20)
- Then Phase 3: Practice Test Flow

---

## Notes

- **Keep It Simple:** Don't over-engineer. MVP goal is to prove concept, not perfection.
- **Test Frequently:** Test each major component before moving to next task.
- **Document Decisions:** If you deviate from plan, document why in comments or memory bank.
- **Environment Setup:** Ensure `.env.local` is in `.gitignore` and never committed.

---

**Status:** Ready to Begin  
**Estimated Time:** 8-12 hours  
**Complexity:** Low-Medium (foundational, but requires careful setup)


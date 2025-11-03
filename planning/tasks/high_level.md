# High-Level Implementation Tasks

**Project:** 10x K-Factor Viral Growth System - MVP  
**Version:** 1.1  
**Last Updated:** 2025-01-21 (Added Phase 10: Deployment)

---

## Overview

This document outlines the high-level implementation tasks in the order they should be completed to build the MVP viral growth system. The MVP consists of:

- **1 Viral Loop**: Buddy Challenge (Student → Student)
- **1 Required Agent**: Loop Orchestrator (decision-making with audit logging)
- **1 Session Intelligence Action**: Auto "Beat-My-Skill" Challenge generation
- **Analytics Dashboard**: Real-time K-factor tracking and funnel visualization

**Target Timeline**: 7-10 days (with 3-4 day buffer)

---

## Phase 1: Project Foundation (Days 1-2)
**Goal**: Set up the development environment and database structure

### 1. Initialize Next.js Project
- Create Next.js app with TypeScript + Tailwind CSS
- Set up folder structure (`app/`, `src/agents/`, `src/services/`, `src/lib/`, `scripts/`)
- Configure environment variables

### 2. Firebase Setup
- Configure Firebase Firestore project
- Set up Firebase Admin SDK (server-side)
- Set up Firebase client SDK (frontend)
- Create all Firestore collections: `users`, `practice_results`, `invites`, `decisions`, `analytics_counters`
- Set up Firestore indexes (for short_code lookups, invite counts)

### 3. Type Definitions
- Create TypeScript interfaces for all data models (User, PracticeResult, Invite, Decision, etc.)
- Define API request/response types

### 4. Question Bank
- Create hardcoded question bank (`src/lib/questionBank.ts`)
- Minimum 10-15 questions per skill (Algebra, Geometry, etc.)

---

## Phase 2: Seed Data (Day 2-3)
**Goal**: Populate demo data to show K-factor ≥1.20 working

### 5. Seed Data Script
- Create `scripts/seed-demo-data.ts`
- Seed 10 users with realistic names and XP
- Create 20 practice results (scores 55-95%)
- Create 25 invites with funnel progression (20 opened, 16 accepted, 14 FVM reached)
- Initialize `analytics_counters` with seed totals
- Verify K-factor calculation shows ≥1.20

---

## Phase 3: Practice Test Flow (Days 3-4)
**Goal**: Users can take practice tests and see results

### 6. Practice Test Page
- Build `/practice` page (10 hardcoded questions)
- Question display and answer selection UI
- Submit functionality

### 7. Practice Completion API
- Create `POST /api/practice/complete`
- Calculate score and identify skill gaps
- Basic eligibility check: `score ≥ 50%`
- Return: `{ resultId, score, skillGaps, shouldShowInvite }`
- **Important**: Do NOT create share link here (that happens on button click)

### 8. Results Page
- Build `/results/[id]` page
- Display score and skill gaps
- Show "Challenge a Friend" button (only if `shouldShowInvite = true`)

---

## Phase 4: Loop Orchestrator Agent (Days 5-6)
**Goal**: AI agent makes intelligent decisions about when to show invites

### 9. Orchestrator Implementation
- Create `LoopOrchestrator` class (`src/agents/LoopOrchestrator.ts`)
- Implement eligibility checks:
  - Score ≥ 50%
  - Invites today < 3
  - Last invite > 1 hour ago
- Decision logging to `decisions` collection
- Return decision with rationale

### 10. Orchestrator API
- Create `POST /api/orchestrator/decide` (internal endpoint)
- Called by `/api/invite/create` when user clicks button

---

## Phase 5: Invite Creation Flow (Days 6-7)
**Goal**: Users can create and share challenge invites

### 11. Session Intelligence Service
- Create challenge generation service
- Skill gap analysis (identify weakest skill)
- Select 5 questions from question bank
- Generate personalized share copy (score-based variants)

### 12. Smart Link Service
- Create short code generation (6-8 alphanumeric chars)
- Uniqueness checking
- Attribution tracking setup

### 13. Invite Creation API
- Create `POST /api/invite/create`
- **Key Flow**: Call Orchestrator for FINAL decision
- If approved: Generate challenge → Create invite → Update analytics counter (`total_invites_sent +1`)
- If denied: Return error (rate_limit_exceeded, cooldown_period, score_too_low)
- Return share URL and share card data

### 14. Share UI
- Update results page to call `/api/invite/create` on button click
- Display share card (text-only for MVP)
- Show share URL (`vt.ly/abc123`)

---

## Phase 6: Challenge Landing & Acceptance (Days 8-9)
**Goal**: Friends can view and accept challenges

### 15. Invite Landing Page
- Create `/invite/[shortCode]` page
- Display inviter name and challenge preview

### 16. Invite Resolution API
- Create `GET /api/invite/:shortCode`
- Log `opened_at` timestamp (if not already logged)
- Update analytics counter: `total_invites_opened +1`
- Return challenge preview data

### 17. Accept Challenge API
- Create `POST /api/invite/:code/accept`
- Mock auth (create user if new)
- Log `invitee_id` and `accepted_at`
- Update analytics counter: `total_invites_accepted +1`
- Return challenge data

---

## Phase 7: Challenge Completion (Days 9-10)
**Goal**: Users can complete challenges and earn rewards

### 18. Challenge Quiz Page
- Create `/challenge/[id]` page
- Display 5 questions from challenge
- Answer selection UI
- Submit button

### 19. Challenge Completion API
- Create `POST /api/challenge/complete`
- Calculate score
- Log `fvm_reached_at` in invite record
- Update analytics counter: `total_fvm_reached +1`
- Distribute 100 XP to both inviter and invitee
- Return results

### 20. Reward Service
- Create reward distribution logic
- Update user XP totals

### 21. Challenge Results UI
- Display score and comparison
- Show reward notification

---

## Phase 8: Analytics Dashboard (Days 11-12)
**Goal**: Real-time K-factor tracking and funnel visualization

### 22. Analytics API
- Create `GET /api/analytics`
- Read from `analytics_counters` (single document)
- Calculate K-factor: `(invites_sent / users) × (fvm_reached / invites_sent)`
- Calculate funnel metrics (open rate, accept rate, FVM rate)
- Return all metrics

### 23. Analytics Dashboard Page
- Create `/analytics` page
- Display K-factor prominently (target: ≥1.20)
- Show funnel metrics in table format (All Time for MVP)
- Conversion rates display
- Manual refresh button

---

## Phase 9: Polish & Demo Prep (Days 12-14)
**Goal**: Production-ready MVP with working demo

### 24. Error Handling
- Graceful degradation (Orchestrator failures, database errors)
- User-friendly error messages
- Loading states

### 25. UI/UX Polish
- Tailwind styling throughout
- Success notifications
- Basic animations/transitions

### 26. Testing & Verification
- Test complete end-to-end flow
- Verify K-factor calculation with seed data
- Test rate limiting and cooldowns
- Test all edge cases

### 27. Demo Preparation
- Create 3-minute demo script
- Verify seed data shows K≥1.20
- Document demo flow

---

## Phase 10: Deployment & Production Setup (Days 14-15)
**Goal**: Deploy MVP to production with separate Firebase production project

### 28. Firebase Production Project Setup
- Create separate Firebase project for production (e.g., `kfactor-prod`)
- **Important**: Keep dev/test project separate from production
- Configure production project:
  - Enable Firestore database
  - Create all required collections (`users`, `practice_results`, `invites`, `decisions`, `analytics_counters`)
  - Set up Firestore security rules (production-ready)
  - Deploy Firestore indexes (`firestore.indexes.json`)
  - Create service account key for production
  - **Note**: Use different project ID than dev/test project

### 29. Environment Configuration
- Create production environment variables:
  - `FIREBASE_SERVICE_ACCOUNT_KEY` (production service account)
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (production project ID)
  - `NEXT_PUBLIC_FIREBASE_API_KEY` (production API key)
- Set up `.env.production` or Vercel environment variables
- **Security**: Never commit production keys to git

### 30. Vercel Deployment
- Connect GitHub repository to Vercel
- Configure build settings:
  - Framework: Next.js
  - Build command: `npm run build`
  - Output directory: `.next`
- Set production environment variables in Vercel dashboard
- Deploy to production URL
- Verify deployment successful

### 31. Production Verification
- Test production deployment:
  - Verify API endpoints work (`/api/orchestrator/decide`, etc.)
  - Test practice test flow end-to-end
  - Verify Firestore connection (production project)
  - Check Firestore indexes are deployed
  - Test analytics dashboard
- **Important**: Test against production Firestore (not dev/test project)

### 32. Domain & DNS (Optional)
- Configure custom domain (if required)
- Set up DNS records
- Verify SSL certificate

### 33. Monitoring & Logging
- Set up error monitoring (Vercel logs, or external service)
- Configure logging for production
- Monitor API response times
- Set up alerts for critical errors

---

## Firebase Project Strategy

### Development/Test Project
- **Purpose**: Local development, testing, demos
- **Project ID**: `k-factor-4634e` (or similar)
- **Usage**: 
  - Local development (`npm run dev`)
  - Automated tests (with emulator)
  - Demo/preview deployments
  - Seed data for testing

### Production Project
- **Purpose**: Live production application
- **Project ID**: `kfactor-prod` (or similar)
- **Usage**:
  - Production deployment on Vercel
  - Real user data
  - Production analytics
- **Security**: 
  - Stricter Firestore security rules
  - Production service account keys (never in git)
  - Environment variables in Vercel dashboard only

### Best Practices
- ✅ **Always separate dev and prod projects**
- ✅ **Never mix test data with production data**
- ✅ **Use different service account keys for each project**
- ✅ **Deploy indexes to both projects**
- ✅ **Test production deployment with production project only**

---

## Critical Implementation Notes

### API Flow Architecture
**Important**: The Orchestrator is NOT called during practice completion. Here's the correct flow:

1. **Practice Completion** (`POST /api/practice/complete`):
   - Calculates score
   - Does basic eligibility check (score ≥50%)
   - Returns `shouldShowInvite: boolean`
   - **Does NOT** call Orchestrator
   - **Does NOT** create share link

2. **Invite Creation** (`POST /api/invite/create`):
   - Called when user clicks "Challenge Friend" button
   - **This is where Orchestrator is called** for final decision
   - If approved: Creates invite, generates challenge, updates counters
   - If denied: Returns error

### Data Models Summary
- **Users**: `id`, `email`, `name`, `xp`, `created_at`
- **Practice Results**: `id`, `user_id`, `score`, `skill_gaps[]`, `completed_at`
- **Invites**: `id`, `short_code`, `inviter_id`, `loop_type`, `created_at`, `opened_at?`, `invitee_id?`, `fvm_reached_at?`, `challenge_data` (embedded)
- **Decisions**: `id`, `user_id`, `event_type`, `decision`, `rationale`, `features_used[]`, `created_at`
- **Analytics Counters**: Single document with `total_users`, `total_invites_sent`, `total_invites_opened`, `total_invites_accepted`, `total_fvm_reached`

### K-Factor Calculation
```
K = (Invites per User) × (Conversion Rate)

Where:
  Invites per User = Total Invites Sent / Total Users
  Conversion Rate = Invites with FVM Reached / Total Invites Sent

Target: K ≥ 1.20
```

### Success Criteria
- ✅ Complete viral loop end-to-end (test → invite → completion)
- ✅ K-factor calculation working (accurate, displayed)
- ✅ Orchestrator making decisions (logged, auditable)
- ✅ Challenge generation automatic (Session Intelligence working)
- ✅ Analytics dashboard showing K-factor ≥1.20
- ✅ 3-minute demo flow functional

---

## Dependencies Between Phases

```
Phase 1 (Foundation)
  ↓
Phase 2 (Seed Data) - Depends on Phase 1
  ↓
Phase 3 (Practice Test) - Depends on Phase 1
  ↓
Phase 4 (Orchestrator) - Depends on Phase 1, Phase 3
  ↓
Phase 5 (Invite Creation) - Depends on Phase 4, Phase 1
  ↓
Phase 6 (Challenge Landing) - Depends on Phase 5
  ↓
Phase 7 (Challenge Completion) - Depends on Phase 6
  ↓
Phase 8 (Analytics) - Depends on Phase 7 (all events need to be tracked)
  ↓
Phase 9 (Polish) - Depends on all previous phases
  ↓
Phase 10 (Deployment) - Depends on Phase 9, requires separate Firebase production project
```

---

## Risk Mitigation

### Technical Risks
- **Firebase Setup Complexity**: Use familiar stack, follow docs closely
- **Analytics Query Performance**: Use pre-calculated counters (simple reads)
- **Question Bank Insufficient**: Start with 10-15 questions per skill

### Product Risks
- **Low K-Factor**: Test with seed users, iterate on copy/UX
- **Spam/Abuse**: Strict rate limiting (3/day, 1hr cooldown)
- **Privacy Concerns**: Privacy-first design (no PII in shares)

---

## References

- **PRD**: See `planning/PRD_MVP.md` for detailed specifications
- **Architecture**: See `planning/architecture.md` for system design
- **Memory Bank**: See `memory-bank/` for project context and patterns

---

**Status**: Ready for Implementation  
**Next Step**: Begin with Phase 1 (Project Foundation)

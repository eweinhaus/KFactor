# Product Requirements Document: Viral Loop - Buddy Challenge

**Version:** 1.0  
**Date:** 2025-01-21  
**Feature:** MVP Feature 3.1  
**Status:** Ready for Implementation

---

## 1. Overview

### 1.1 Feature Description
The Buddy Challenge is a student-to-student viral loop that allows users to challenge friends to beat their practice test scores. After completing a practice test, students can generate a shareable challenge that invites friends to take a 5-question quiz on their weakest skill. Both users earn rewards when the challenge is completed.

### 1.2 Goals
- Enable social sharing and competition between students
- Drive viral growth through friend-to-friend invitations
- Measure K-factor for the Buddy Challenge loop
- Create an engaging, gamified learning experience

### 1.3 Success Metrics
- **Primary**: Achieve K ≥ 1.20 for Buddy Challenge loop
- **Conversion Rates**: 
  - Open rate: Target >60% (invite opened / invite sent)
  - Accept rate: Target >70% (user signed up / invite opened)
  - FVM rate: Target >80% (challenge completed / invite sent)
- **Engagement**: Average 1.5 invites per active user per week

---

## 2. User Stories

### 2.1 Inviter (Alex - Student)

1. **As a student** who just completed a practice test with 78% score, **I want to** challenge a friend to beat my score **so that** we can compete and both earn rewards.

2. **As a student**, when I click "Challenge a Friend", **I want to** see a shareable link and card **so that** I can easily share it on social media or via text.

3. **As a student**, **I want to** receive 100 XP when my friend completes my challenge **so that** I'm rewarded for inviting them.

### 2.2 Invitee (Sam - Friend)

1. **As a friend** who receives a challenge link, **I want to** see what skill I'm being challenged on and the inviter's score **so that** I understand what I'm competing against.

2. **As a friend**, when I click the challenge link, **I want to** take a quick 5-question quiz **so that** I can prove I'm better and earn rewards.

3. **As a friend**, after completing the challenge, **I want to** see my score compared to the inviter's score **so that** I know if I won or lost.

4. **As a friend**, **I want to** receive 100 XP when I complete the challenge **so that** I'm rewarded for engaging.

---

## 3. Feature Specifications

### 3.1 Trigger Point

**When:** After user completes a practice test and sees results page

**Conditions:**
- Practice test must be completed
- Orchestrator agent must approve (see PRD_loop_orchestrator.md)
- Score must be ≥50% (handled by Orchestrator)

**UI Location:** Results page (`/results/:resultId`)

### 3.2 Share Flow

#### 3.2.1 Challenge Creation

**User Action:** Click "Challenge a Friend" button on results page

**Backend Process:**
1. Call Orchestrator to make final decision (re-check eligibility)
2. If approved: Call Session Intelligence to generate challenge
3. Generate smart link via Attribution Service
4. Create invite record in database
5. Update analytics counters (invites_sent +1)
6. Generate text-based share card

**API Endpoint:** `POST /api/invite/create`

**Request:**
```typescript
{
  userId: string;
  resultId: string;
}
```

**Response (Success):**
```typescript
{
  shortCode: string;          // "a3x9k2"
  shareUrl: string;           // "https://vt.ly/a3x9k2"
  shareCard: {
    text: string;             // "I got 78% on Algebra. Can you do better?"
    inviterName: string;      // First name only
    score: number;
    skill: string;
  };
}

// OR if Orchestrator denies:
{
  error: "rate_limit_exceeded" | "cooldown_period" | "score_too_low";
  message: string;            // User-friendly error message
}
```

#### 3.2.2 Share Card Generation (Text-Only for MVP)

**Requirements:**
- **Privacy-Safe**: Only first name, no last name, email, or profile photo
- **Format**: Text-based preview in styled div (no image generation for MVP)
- **Content**: Include score, skill, and personalized message
- **Simple**: Display as card-like UI component, not shareable image

**Share Card Structure (MVP):**
```
┌──────────────────────────────┐
│  Share Your Challenge        │
├──────────────────────────────┤
│                              │
│  Alex scored 78% on Algebra! │
│                              │
│  "I got 78% on Algebra.     │
│   Can you do better?"        │
│                              │
│  Share Link:                 │
│  [vt.ly/a3x9k2] [Copy]      │
│                              │
└──────────────────────────────┘
```

**Note:** Image generation and social share buttons deferred to future phases for faster MVP delivery.

**Share Copy Personalization:**
- High score (≥80%): "I just crushed [Skill] with [Score]%! Think you can beat me? 😎"
- Medium score (60-79%): "I got [Score]% on [Skill]. Can you do better?"
- Low score (50-59%): "[Skill] is tough! I got [Score]%. Want to practice together?"

#### 3.2.3 Smart Link Generation

**Format:** `vt.ly/[shortCode]`

**Short Code Requirements:**
- 6-8 alphanumeric characters
- Unique per invite
- Case-insensitive
- URL-safe characters only

**Attribution Tracking:**
- Link resolves to: `/invite/:shortCode`
- Logs `opened_at` timestamp on click
- Stores `inviter_id` for reward attribution
- Tracks full funnel: sent → opened → accepted → FVM

### 3.3 Landing Page Flow

#### 3.3.1 Invite Landing Page (`/invite/:shortCode`)

**Purpose:** Convert link click into challenge acceptance

**Content:**
- Inviter's first name and score
- Challenge skill name
- Personalized message/call-to-action
- Preview of challenge (5 questions on [Skill])
- "Accept Challenge" button

**Design:**
```
┌──────────────────────────────┐
│                              │
│  Alex challenged you!         │
│                              │
│  Beat 78% on Algebra         │
│                              │
│  "I got 78% on Algebra.     │
│   Can you do better?"        │
│                              │
│  Challenge:                  │
│  • 5 questions               │
│  • Algebra: Quadratics      │
│  • ~2 minutes                │
│                              │
│  [Accept Challenge]          │
│                              │
└──────────────────────────────┘
```

**API Endpoint:** `GET /api/invite/:shortCode`

**Response:**
```typescript
{
  inviter: {
    name: string;            // First name only
  };
  challenge: {
    skill: string;
    questions: Question[];    // 5 questions
    estimatedTime: string;    // "2 min"
  };
  callToAction: string;       // "Beat Alex's 78% on Algebra!"
}
```

**Side Effects:**
- Log `opened_at` timestamp in invites collection (if not already logged)
- Update analytics counter: `total_invites_opened +1`
- Track attribution for analytics

#### 3.3.2 Challenge Acceptance

**User Action:** Click "Accept Challenge" button

**Backend Process:**
1. If new user, create account (mock auth for MVP)
2. Log `invitee_id` and `accepted_at` in invite record
3. Update analytics counter: `total_invites_accepted +1`
4. Create challenge instance
5. Redirect to challenge page

**API Endpoint:** `POST /api/invite/:shortCode/accept`

**Request:**
```typescript
{
  email?: string;             // Optional for new users
  name: string;
}
```

**Response:**
```typescript
{
  userId: string;
  challenge: {
    id: string;
    skill: string;
    questions: Question[];
  };
}
```

### 3.4 Challenge Quiz Flow

#### 3.4.1 Challenge Page (`/challenge/:challengeId`)

**Purpose:** Allow invitee to take the 5-question quiz

**Components:**
- Question display (one at a time or all at once)
- Answer selection (multiple choice for MVP)
- Timer (optional for MVP)
- Submit button

**Question Format:**
```typescript
interface Question {
  id: string;
  text: string;
  options: string[];         // 4 options
  correctAnswer: number;     // Index of correct answer
  skill: string;
}
```

**Example UI:**
```
┌──────────────────────────────┐
│  Challenge: Algebra          │
│  Question 1 of 5             │
├──────────────────────────────┤
│                              │
│  Solve: x² + 5x + 6 = 0     │
│                              │
│  ○ x = -2, x = -3           │
│  ○ x = 2, x = 3             │
│  ○ x = -1, x = -6           │
│  ○ x = 1, x = 6             │
│                              │
│  [Next Question]             │
│                              │
└──────────────────────────────┘
```

#### 3.4.2 Challenge Submission

**User Action:** Submit answers after completing all 5 questions

**Backend Process:**
1. Calculate score (correct answers / total questions)
2. Log `fvm_reached_at` timestamp (First Value Moment reached)
3. Update analytics counter: `total_fvm_reached +1`
4. Distribute rewards to both users (100 XP each)
5. Update user XP totals
6. Return results page

**API Endpoint:** `POST /api/challenge/complete`

**Request:**
```typescript
{
  challengeId: string;
  userId: string;
  answers: Answer[];         // Array of answer indices
}
```

**Response:**
```typescript
{
  score: number;             // 0-100
  correctAnswers: number;     // Out of 5
  reward: {
    xp: number;              // 100
    message: string;         // "You earned 100 XP!"
  };
  comparison: {
    inviterScore: number;    // Original score from practice test
    inviteeScore: number;     // Current score
    winner: "inviter" | "invitee" | "tie";
  };
}
```

### 3.5 Reward Distribution

**Reward Structure:**
- **Inviter**: 100 XP when invitee completes challenge (FVM reached)
- **Invitee**: 100 XP when they complete the challenge

**Distribution Logic:**
```typescript
// When FVM reached:
1. Update invitee XP: user.xp += 100
2. Update inviter XP: inviter.xp += 100
3. Log reward transactions (optional for MVP)
4. Send notifications (optional for MVP)
```

**Notification Messages:**
- Inviter: "Sam completed your challenge! You earned 100 XP. 🎉"
- Invitee: "Challenge complete! You earned 100 XP. 🎉"

### 3.6 Funnel Tracking

**Stages:** Sent (created_at) → Opened (opened_at) → Accepted (invitee_id) → FVM (fvm_reached_at)  
**Metrics:** Open Rate (Opened/Sent), Accept Rate (Accepted/Opened), FVM Rate (FVM/Sent)  
**Implementation:** All timestamps in invites collection, analytics queries for conversion rates

---

## 4. Technical Specifications

### 4.1 Data Models

#### Invites Collection
```typescript
{
  id: string;
  short_code: string;         // "a3x9k2"
  inviter_id: string;          // User who created invite
  loop_type: string;           // "buddy_challenge"
  
  // Funnel tracking
  created_at: timestamp;       // Stage 1: Sent
  opened_at: timestamp?;       // Stage 2: Opened
  invitee_id: string?;         // Stage 3: Accepted
  fvm_reached_at: timestamp?;   // Stage 4: FVM Reached
  
  // Challenge data
  challenge_data: {
    skill: string;
    questions: Question[];
    share_copy: string;
    inviter_score: number;     // Original practice test score
  };
  
  // Metadata
  result_id: string;           // Link to original practice result
}
```

#### Challenges Collection (Optional - can be embedded in Invites)
```typescript
{
  id: string;
  invite_id: string;          // FK to invites
  skill: string;
  questions: Question[];
  invitee_score: number?;      // Calculated after completion
  completed_at: timestamp?;
}
```

### 4.2 API Endpoints

**POST `/api/invite/create`:** Orchestrator decides → Generate challenge (Session Intelligence) → Create short code → Create invite → Update counters (invites_sent +1) → Return share URL/card  
**Errors:** 404 (user/result not found), 429 (rate limit), 400 (orchestrator denied), 500 (graceful degradation)

**GET `/api/invite/:shortCode`:** Lookup invite → Log opened_at (if not logged) → Update counters (invites_opened +1) → Return inviter/challenge preview  
**Errors:** 404 (invalid code), 410 (expired)

**POST `/api/invite/:shortCode/accept`:** Lookup → Create/authenticate user → Log invitee_id → Update counters (invites_accepted +1) → Return challenge  
**Errors:** 404 (invalid code), 409 (already accepted)

**POST `/api/challenge/complete`:** Validate → Calculate score → Log fvm_reached_at → Update counters (fvm_reached +1) → Update XP (both users) → Return results  
**Errors:** 404 (not found), 409 (already completed), 400 (invalid format)

### 4.3 Frontend Components

**ResultsPage:** Displays results, conditional "Challenge Friend" button, share flow  
**ShareModal:** Share card preview, copyable URL, social buttons (optional)  
**InviteLandingPage:** Challenge preview, inviter info, accept button, signup/login  
**ChallengeQuiz:** Question display, answer selection, submit, progress indicator  
**ChallengeResults:** Score display, comparison, winner/tie, reward notification

---

## 5. User Experience Flow

### 5.1 Happy Path
Alex completes test (78%) → Orchestrator approves → Share modal (vt.ly/a3x9k2) → Sam clicks link → Landing page → Accepts challenge → Completes quiz (85%) → Both earn 100 XP

### 5.2 Error Scenarios
**Rate Limit:** Button hidden (Orchestrator), no error shown  
**Low Score:** Button hidden (Orchestrator), no error shown  
**Already Accepted:** Error message, redirect to challenge  
**Invalid Link:** Error page, offer signup

---

## 6. Acceptance Criteria

### 6.1 Functional Requirements

✅ **Invite Creation:**
- User can create invite after completing practice test
- Share card generated with privacy-safe information
- Smart link created and stored in database

✅ **Link Resolution:**
- Smart link resolves correctly to landing page
- Inviter information displayed (first name only)
- Challenge preview shown

✅ **Challenge Acceptance:**
- New users can sign up via invite link
- Existing users can accept challenge
- Challenge instance created upon acceptance

✅ **Quiz Functionality:**
- 5 questions displayed correctly
- Answers can be selected
- Score calculated accurately
- Results displayed with comparison

✅ **Reward Distribution:**
- Both users receive 100 XP upon completion
- XP totals updated correctly
- Reward notifications displayed

✅ **Funnel Tracking:**
- All stages logged with timestamps
- Analytics can query funnel data
- Conversion rates calculated correctly

### 6.2 Non-Functional Requirements

✅ **Performance:**
- Share link generation: <500ms
- Challenge page load: <1s
- Quiz submission: <500ms

✅ **Privacy:**
- Share cards contain no PII (first name only)
- No email addresses in shareable content
- Smart links don't expose user data

✅ **Security:**
- Short codes are unique and non-guessable
- Rate limiting prevents spam
- Challenge data validated before saving

---

## 7. Future Enhancements

**Additional Features:** Email/SMS sharing, social share buttons, rematch functionality, leaderboards, history page, video/audio questions, multiple challenge types

**Optimization:** A/B test share copy, personalize difficulty, dynamic question selection, streak/referral bonuses

---

## 8. Dependencies & Risks

**Internal Dependencies:** Loop Orchestrator (approval), Session Intelligence (challenge generation), Analytics Dashboard (metrics)  
**External Dependencies:** Firebase Firestore, Next.js API Routes, frontend components

**Technical Risks:** Smart link collisions (UUID codes, uniqueness check), challenge generation failures (generic fallback), data loss (immediate logging, transactions)  
**Product Risks:** Low conversion (A/B test copy/UX), spam/abuse (rate limits, fraud detection), low sharing (frictionless UX, social proof, incentives)

---

**Document Status:** Ready for Implementation  
**Last Updated:** 2025-01-21  
**Related Documents:** PRD_loop_orchestrator.md, PRD_session_intelligence.md, PRD_analytics_dashboard.md


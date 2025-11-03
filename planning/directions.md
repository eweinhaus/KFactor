# 10x K Factor — Viral, Gamified, Supercharged Varsity Tutors

**Finalized Bootcamp Brief**

---

## The Challenge

Varsity Tutors has rich products (1:1 scheduled tutoring, instant on-demand tutoring, AI tutoring, live classes, diagnostics, practice, flashcards, etc.). Design and implement a production-ready growth system that makes learning feel **fun, social, and "alive,"** and that **10×'s viral growth** by turning every touchpoint into a shareable, referable moment—across students, parents, and tutors.

---

## Core Objectives

- **Ship ≥ 4 closed-loop viral mechanics** that measurably increase K-factor  
  - **K-factor formula**: `K = invites per user × invite conversion rate`
  - Choose which 4+ to build (examples provided below; encouraged to propose others)

- **Make the platform feel alive**: presence signals, activity feed, mini-leaderboards, and cohort rooms that show "others are learning with you"

- **Convert async results pages** (diagnostics, practice tests, flashcards, etc.) into powerful viral surfaces with share cards, deep links, and cohort challenges

- **Prove lift** with a controlled experiment and a clear analytics plan

---

## Required Agents (Minimum)

All agents communicate via **Model Context Protocol (MCP) servers**. Each decision must include a short rationale for auditability.

| Agent | Status | Responsibility |
|-------|--------|----------------|
| **Loop Orchestrator Agent** | `[required]` | Chooses which loop to trigger (after session, badge earned, streak preserved, results page view, etc.); coordinates eligibility & throttling |
| **Personalization Agent** | `[required]` | Tailors invites, rewards, and copy by persona (student/parent/tutor), subject, and intent |
| **Incentives & Economy Agent** | Recommended | Manages credits/rewards (AI Tutor minutes, class passes, gem/XP boosts), prevents abuse, ensures unit economics |
| **Social Presence Agent** | Recommended | Publishes presence ("28 peers practicing Algebra now"), recommends cohorts/clubs, nudges "invite a friend to join this practice" |
| **Tutor Advocacy Agent** | Recommended | Generates share-packs for tutors (smart links, auto thumbnails, one-tap WhatsApp/SMS) and tracks referrals/attribution |
| **Trust & Safety Agent** | Recommended | Fraud detection, COPPA/FERPA-aware redaction, duplicate device/email checks, rate-limits, report/undo |
| **Experimentation Agent** | `[required]` | Allocates traffic, logs exposures, computes K, uplift, and guardrail metrics in real time |

---

## Session Intelligence

**Transcription → Agentic Actions → Viral**

All live and instant sessions are transcribed and summarized. These summaries power agentic actions for students and tutors that also seed viral behaviors.

### Minimum Agentic Actions

**Ship ≥ 4 total actions** (≥2 for students, ≥2 for tutors)

#### For Students (Ship ≥ 2)

**Example 1: Auto "Beat-My-Skill" Challenge**
- From the summary's skill gaps, generate a 5-question micro-deck with a share link to challenge a friend
- Both get streak shields if friend reaches FVM within 48h

**Example 2: Study Buddy Nudge**
- If summary shows upcoming exam or stuck concept, create a co-practice invite tied to the exact deck
- Presence shows "friend joined"

#### For Tutors (Ship ≥ 2)

**Example 1: Parent Progress Reel + Invite**
- Auto-compose a privacy-safe 20–30s reel (key moments & wins) with a referral link for the parent to invite another parent for a class pass

**Example 2: Next-Session Prep Pack Share**
- Tutor receives an AI-generated prep pack and a class sampler link to share with peers/parents
- Joins credit the tutor's referral XP

> **⚠️ Important**: All actions must be **COPPA/FERPA safe**, with parental gating for minors and clear consent UX.

---

## Core Requirements

### Async Results as Viral Surfaces

Diagnostics, practice tests, and other async tools produce results pages (scores, skills heatmaps, recommendations) that must:

- Render **privacy-safe share cards** for student/parent/tutor variants
- Offer **"Challenge a friend / Invite a study buddy" CTAs** tied to the exact skill deck/class/AI practice set
- Provide **deep links** landing new users directly in a bite-size first-value moment (e.g., 5-question skill check)
- Include **cohort/classroom variants** for teachers/tutors to invite groups

### "Alive" Layer

- Presence pings
- Study map
- Mini-leaderboards per subject
- "Friends online now"
- Cohort rooms

### Instant-Value Rewards

Credits/gems/time passes that are immediately usable:
- 15 minutes of AI Tutor
- Class samplers
- Practice power-ups

### Cross-Surface Hooks

Web, mobile, email, push, SMS; deep links prefill context

### Analytics

Event schema for:
- Invites
- Opens
- Joins
- **FVM** (First Value Moment)
- Retention (D1/D7/D28)
- LTV deltas

---

## Viral Loop Menu

> **Important**: We are not prescribing which to build. Choose any 4+ that best fit your squad's thesis, and feel free to add original ideas.

### 1. Buddy Challenge (Student → Student)
After practice or on results pages, share a "Beat-my-score" micro-deck; both get streak shields if friend reaches FVM.

### 2. Results Rally (Async → Social)
Diagnostics/practice results generate a rank vs. peers and a challenge link; cohort leaderboard refreshes in real time.

### 3. Proud Parent (Parent → Parent)
Weekly recap card + shareable progress reel; "Invite a parent" for a class pass.

### 4. Tutor Spotlight (Tutor → Family/Peers)
After 5★ session, generate a tutor card + invite link; tutor accrues XP/leaderboard perks when joins convert.

### 5. Class Watch-Party (Student Host → Friends)
Co-watch recorded class with synced notes; host invites 1–3 friends; guests get class sampler + AI notes.

### 6. Streak Rescue (Student → Student)
When a streak is at risk, prompt "Phone-a-friend" to co-practice now; both receive streak shields upon completion.

### 7. Subject Clubs (Multi-user)
Join a live subject club; each member gets a unique friend pass; presence shows "friends joined."

### 8. Achievement Spotlight (Any persona)
Auto-generated milestone badges convert to social cards (safe by default); clickthrough gives newcomers a try-now micro-task.

---

## Technical Specifications

### Architecture

- **MCP** between agents; JSON-schema contracts
- **<150ms decision SLA** for in-app triggers
- **Concurrency**: 5k concurrent learners; peak 50 events/sec orchestrated

### Attribution

- Signed smart links (short codes) with UTM + cross-device continuity

### Data Pipeline

```
Event bus → stream processing → warehouse/model store
```

- PII minimized
- Child data segregated

### Explainability

Each agent logs:
- `decision`
- `rationale`
- `features_used`

### Failure Mode

Graceful degradation to default copy/reward if agents are down.

---

## Infrastructure Constraints

### Privacy/Compliance

- **COPPA/FERPA** safe defaults
- Clear consent flows

---

## Ambiguous Elements (You Must Decide)

- **Optimal reward mix** (AI minutes vs. gem boosts vs. class passes) by persona and CAC/LTV math
- **Fairness in leaderboards** (new users vs. veterans; age bands)
- **Spam thresholds**: caps on invites/day; cool-downs; school email handling
- **K-factor definition** for multi-touch joins (view → sign-up → FVM)
- **Tutor incentives** and disclosures

---

## Success Metrics

| Metric | Target |
|--------|--------|
| **Primary** | Achieve **K ≥ 1.20** for at least one loop over a 14-day cohort |
| **Activation** | **+20% lift** to first-value moment (first correct practice or first AI-Tutor minute) |
| **Referral Mix** | Referrals ≥ **30% of new weekly signups** (from baseline [__]%) |
| **Retention** | **+10% D7 retention** for referred cohorts |
| **Tutor Utilization** | **+5%** via referral conversion to sessions |
| **Satisfaction** | ≥ **4.7/5 CSAT** on loop prompts & rewards |
| **Abuse** | **<0.5%** fraudulent joins; **<1%** opt-out from growth comms |

---

## Deliverables (Bootcamp)

1. **Thin-slice prototype** (web/mobile) with ≥ 4 working loops and live presence UI

2. **MCP agent code** (or stubs) for Orchestrator, Personalization, Incentives, Experimentation

3. **Session transcription + summary hooks** that trigger ≥ 4 agentic actions (≥2 tutor, ≥2 student) feeding viral loops

4. **Signed smart links + attribution service**

5. **Event spec & dashboards**: K, invites/user, conversion, FVM, retention, guardrails

6. **Copy kit**: dynamic templates by persona, localized [en + __]

7. **Risk & compliance memo** (1-pager): data flows, consent, gating

8. **Results-page share packs** for diagnostics/practice/async tools (cards, reels, deep links)

9. **Run-of-show demo**: 3-minute journey from trigger → invite → join → FVM

---

## Analytics & Experiment Design

### K-Factor Tracking

Key events:
- `invites_sent`
- `invite_opened`
- `account_created`
- `FVM_reached`

### Attribution

- **Last-touch** for join
- **Multi-touch** stored for analysis

### Guardrails

- Complaint rate
- Opt-outs
- Latency to FVM
- Support tickets

### Dashboards

- Cohort curves (referred vs. baseline)
- Loop funnel drop-offs
- LTV deltas

### Results-Page Funnels

```
impressions → share clicks → join → FVM
```

Per tool (diagnostics, practice tests, flashcards)

### Transcription-Action Funnels

```
session → summary → agentic action → invite → join → FVM
```

---

## Acceptance Criteria

- ✅ **≥ 4 viral loops** functioning end-to-end with MCP agents
- ✅ **≥ 4 agentic actions** (≥2 tutor, ≥2 student) triggered from session transcription, each feeding a viral loop
- ✅ **Measured K** for a seeded cohort and a clear readout (pass/fail vs K ≥ 1.20)
- ✅ **Demonstrated presence UI** and at least one leaderboard or cohort room
- ✅ **Compliance memo approved** and results-page sharing active for diagnostics/practice/async tools

# Project Brief: 10x K-Factor Viral Growth System

**Project Name:** KFactor - Viral Growth Engineering Challenge  
**Version:** 1.0  
**Last Updated:** 2025-01-21

---

## Executive Summary

This project is a viral growth engineering challenge to transform Varsity Tutors' learning platform into a social, gamified experience that drives exponential user acquisition through viral growth mechanics. The goal is to achieve a **K-factor ≥ 1.20**, where each user brings 1.2+ new users through shareable, referable moments.

### Core Challenge

Build a production-ready viral growth system that makes learning feel **fun, social, and "alive"**, turning every touchpoint into a shareable, referable moment across students, parents, and tutors.

---

## Project Scope

### MVP Phase (Current Focus)

The MVP focuses on demonstrating the core viral growth mechanics with minimal complexity:

- **1 Viral Loop**: Buddy Challenge (Student → Student)
- **1 Required Agent**: Loop Orchestrator (decision-making with audit logging)
- **1 Session Intelligence Action**: Auto "Beat-My-Skill" Challenge generation
- **1 Analytics Dashboard**: Real-time K-factor tracking and funnel visualization

### Target Audience (MVP)

- **Primary**: Students (grades 6-12)
- **Out of Scope for MVP**: Parents, Tutors (planned for future phases)

---

## Primary Success Metrics

- **Primary**: Achieve **K ≥ 1.20** for Buddy Challenge loop over a 14-day cohort
- **Activation**: +20% lift to first-value moment (FVM) activation
- **Referral Mix**: Referrals ≥ 30% of new weekly signups
- **Retention**: +10% D7 retention for referred cohorts
- **Satisfaction**: ≥ 4.7/5 CSAT on loop prompts & rewards
- **Abuse Prevention**: <0.5% fraudulent joins; <1% opt-out from growth comms

---

## K-Factor Definition

**Formula:**
```
K = (Invites per User) × (Conversion Rate)

Where:
  Invites per User = Total Invites Sent / Total Users in Cohort
  Conversion Rate = Invites with FVM Reached / Total Invites Sent
```

**Target**: K ≥ 1.20 (each user brings 1.2+ new users)

---

## Core Objectives

1. **Ship ≥ 1 closed-loop viral mechanic** (MVP: Buddy Challenge)
   - Measurably increase K-factor
   - Complete attribution tracking (sent → opened → accepted → FVM)

2. **Make the platform feel alive** (Future phases)
   - Presence signals ("28 peers practicing Algebra now")
   - Activity feeds
   - Mini-leaderboards per subject
   - Cohort rooms

3. **Convert async results pages into viral surfaces**
   - Share cards (privacy-safe)
   - Deep links landing new users directly in first-value moment
   - Challenge CTAs tied to exact skill decks

4. **Prove lift with controlled experiment**
   - Clear analytics plan
   - K-factor calculation
   - Funnel tracking at each stage

---

## Technical Foundation

### Technology Stack (MVP)

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Mock auth (MVP), Firebase Auth (future)
- **Deployment**: Vercel

### Agent Architecture

The system uses an agent-oriented architecture pattern:
- **Loop Orchestrator**: Makes intelligent decisions about when to trigger viral loops
- All decisions logged with rationale for auditability
- Extensible design for adding more agents (Personalization, Experimentation, etc.)

---

## MVP Feature Set

1. **Viral Loop: Buddy Challenge**
   - Practice test results page with "Challenge a Friend" button
   - Share card generation and smart link creation
   - Challenge landing page and 5-question quiz
   - Reward distribution system

2. **Loop Orchestrator Agent**
   - Eligibility checking and rate limiting (3 invites/day, 1 hour cooldown)
   - Score threshold evaluation (≥50%)
   - Decision logging with rationale

3. **Session Intelligence: Auto "Beat-My-Skill" Challenge**
   - Skill gap analysis
   - Question selection from skill bank
   - Personalized share copy generation

4. **Analytics Dashboard**
   - K-factor calculation (target: ≥1.20)
   - Funnel tracking (sent → opened → accepted → FVM)
   - Conversion rates at each stage

---

## Compliance & Privacy

- **Privacy-Safe Share Cards**: Only first name (no last name, email, or profile photo)
- **Rate Limiting**: Max 3 invites per user per day, 1 hour cooldown
- **COPPA/FERPA Considerations**: MVP assumes users 13+ (parental gates planned for future)
- **Auditability**: All Orchestrator decisions logged with rationale

---

## Timeline & Deliverables

### MVP Timeline: 7-10 days

**Week 1**: Foundation & Core Loop
- Practice test page + results page
- Orchestrator agent + invite flow

**Week 2**: Challenge & Analytics
- Session Intelligence (challenge generation)
- Challenge completion + rewards
- Analytics dashboard + polish

### Key Deliverables

1. Working viral loop end-to-end
2. Agent code (Loop Orchestrator) with decision logging
3. Smart links + attribution service
4. Analytics dashboard showing K-factor
5. 3-minute demo: trigger → invite → join → FVM

---

## Future Phases (Post-MVP)

- **Phase 2**: Additional viral loops (Streak Rescue, Achievement Spotlight)
- **Phase 3**: Additional agents (Personalization, Experimentation)
- **Phase 4**: Multi-persona (Parents, Tutors)
- **Phase 5**: Advanced features (real-time presence, leaderboards, real session transcription)

---

## Success Criteria

✅ **≥ 1 viral loop** functioning end-to-end with agent  
✅ **≥ 1 session intelligence action** triggered from practice results  
✅ **Measured K-factor** for a seeded cohort (target: ≥1.20)  
✅ **Analytics dashboard** with funnel metrics  
✅ **Compliance considerations** documented (privacy, rate limiting)

---

**Project Status**: MVP Planning Complete, Ready for Implementation  
**Next Step**: Begin implementation with project setup and foundation


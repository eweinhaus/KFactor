# KFactor - Viral Growth System

10x K-Factor Viral Growth Engineering Challenge MVP

## Overview

This project implements a viral growth system for Varsity Tutors' learning platform, focusing on the Buddy Challenge viral loop with a K-factor target of ≥1.20.

## Technology Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, TypeScript
- **Database**: Firebase Firestore
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase account (for Firestore)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project in [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database (start in production mode for MVP)
3. Get your Firebase configuration:
   - Go to Project Settings > General > Your apps
   - Copy the config values
4. Get Service Account Key:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Save the JSON file (do NOT commit to git)

### 3. Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase configuration values in `.env.local`

3. For `FIREBASE_SERVICE_ACCOUNT_KEY`:
   - Take the service account JSON file
   - Convert it to a single-line string (remove all newlines)
   - Paste it as the value

### 4. Create Firestore Collections

Create the following collections in Firebase Console:

- `users`
- `practice_results`
- `invites`
- `decisions`
- `analytics_counters` (create a document with `id: "main"`)

### 5. Set Up Firestore Indexes

Create the following composite indexes in Firebase Console:

- `invites`: Index on `short_code` (unique)
- `invites`: Composite index on `inviter_id` + `created_at`
- `invites`: Index on `created_at`
- `decisions`: Composite index on `user_id` + `created_at`

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
kfactor/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── ...                # Pages
├── src/
│   ├── agents/            # Agent classes (LoopOrchestrator, etc.)
│   ├── services/          # Business logic
│   ├── lib/               # Utilities (firebase, questionBank)
│   └── types/             # TypeScript type definitions
├── scripts/               # Seed data and utility scripts
└── memory-bank/           # Project documentation
```

## Development

### Type Checking

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Phase 1 Status

✅ Project structure created
✅ TypeScript type definitions
✅ Firebase configuration files
✅ Question bank (45 questions across 3 skills)
⏳ Firebase project setup (manual step)
⏳ Firestore collections creation (manual step)
⏳ Environment variables configuration (manual step)

## Next Steps

1. Complete Firebase setup (see manual steps below)
2. Run `npm install` to install dependencies
3. Verify build works: `npm run build`
4. Proceed to Phase 2: Seed Data

## Manual Steps Required

### 1. Install Node.js (if not installed)

Download and install Node.js 18+ from [nodejs.org](https://nodejs.org/)

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard
4. Enable Firestore Database (choose production mode)
5. Note your Project ID

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local` if not already done
2. Fill in all Firebase configuration values
3. Add service account key as single-line JSON string

### 5. Create Firestore Collections and Indexes

See "Setup Instructions" above for details.

### 6. Verify Installation

```bash
npm run dev
```

Visit http://localhost:3000 - should see the homepage.

```bash
npm run build
```

Should compile without TypeScript errors.

## License

Private project - Varsity Tutors


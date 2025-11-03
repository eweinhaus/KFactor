/**
 * Seed Demo Data Script
 * Creates realistic demo data to demonstrate K-factor ≥1.20 working
 * Run with: npm run seed:demo
 * Clear first: npm run seed:demo -- --clear
 */

// IMPORTANT: Load environment variables FIRST before any Firebase imports
// This must be at the top to ensure env vars are loaded before firebase-admin initializes
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local from project root
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded .env.local');
} else {
  console.warn(`⚠️  .env.local not found at ${envPath}`);
}

// Debug: Check if service account key is loaded (without showing the actual key)
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables');
  console.error('   Make sure .env.local contains FIREBASE_SERVICE_ACCOUNT_KEY');
  process.exit(1);
}

try {
  const parsed = JSON.parse(serviceAccountKey);
  if (!parsed.project_id) {
    console.error('❌ Service account key missing project_id property');
    console.error('   Make sure FIREBASE_SERVICE_ACCOUNT_KEY is a valid JSON string');
    process.exit(1);
  }
  console.log(`✅ Service account key loaded (project: ${parsed.project_id})`);
} catch (error) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON');
  console.error('   Make sure the value is a valid JSON string (single line, no newlines)');
  process.exit(1);
}

// Now safe to import Firebase (env vars are loaded)
import admin from 'firebase-admin';
import { Question } from '../src/types';
import * as readline from 'readline';

// Import db after env vars are loaded - we'll initialize it in the main function
let db: admin.firestore.Firestore;

const Timestamp = admin.firestore.Timestamp;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function timestampDaysAgo(days: number): admin.firestore.Timestamp {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return Timestamp.fromDate(date);
}

function timestampHoursFromNow(hours: number, fromDate: Date = new Date()): admin.firestore.Timestamp {
  const date = new Date(fromDate);
  date.setHours(date.getHours() + hours);
  return Timestamp.fromDate(date);
}

function generateShortCode(index: number): string {
  return `seed${String(index).padStart(2, '0')}`;
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer: string) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// ============================================================================
// SEED DATA DEFINITIONS
// ============================================================================

interface UserSeedData {
  name: string;
  email: string;
  xp: number;
  id: string;
}

interface PracticeResultSeedData {
  userId: string;
  score: number;
  skillGaps: string[];
  daysAgo: number;
}

const seedUsers: UserSeedData[] = [
  { id: 'user_alex', name: 'Alex Chen', email: 'alex@demo.com', xp: 500 },
  { id: 'user_sam', name: 'Sam Rodriguez', email: 'sam@demo.com', xp: 350 },
  { id: 'user_jordan', name: 'Jordan Kim', email: 'jordan@demo.com', xp: 280 },
  { id: 'user_taylor', name: 'Taylor Smith', email: 'taylor@demo.com', xp: 420 },
  { id: 'user_morgan', name: 'Morgan Lee', email: 'morgan@demo.com', xp: 300 },
  { id: 'user_casey', name: 'Casey Brown', email: 'casey@demo.com', xp: 200 },
  { id: 'user_riley', name: 'Riley Davis', email: 'riley@demo.com', xp: 180 },
  { id: 'user_avery', name: 'Avery Wilson', email: 'avery@demo.com', xp: 150 },
  { id: 'user_quinn', name: 'Quinn Martinez', email: 'quinn@demo.com', xp: 100 },
  { id: 'user_cameron', name: 'Cameron Taylor', email: 'cameron@demo.com', xp: 90 },
];

const seedPracticeResults: PracticeResultSeedData[] = [
  // Alex (2 results)
  { userId: 'user_alex', score: 85, skillGaps: ['Algebra'], daysAgo: 10 },
  { userId: 'user_alex', score: 78, skillGaps: ['Quadratic Equations'], daysAgo: 7 },
  // Sam (2 results)
  { userId: 'user_sam', score: 72, skillGaps: ['Geometry'], daysAgo: 9 },
  { userId: 'user_sam', score: 68, skillGaps: ['Algebra'], daysAgo: 5 },
  // Jordan (2 results)
  { userId: 'user_jordan', score: 82, skillGaps: ['Calculus'], daysAgo: 8 },
  { userId: 'user_jordan', score: 75, skillGaps: ['Algebra'], daysAgo: 4 },
  // Taylor (3 results)
  { userId: 'user_taylor', score: 90, skillGaps: ['Geometry'], daysAgo: 12 },
  { userId: 'user_taylor', score: 88, skillGaps: ['Calculus'], daysAgo: 6 },
  { userId: 'user_taylor', score: 65, skillGaps: ['Algebra'], daysAgo: 3 },
  // Morgan (2 results)
  { userId: 'user_morgan', score: 70, skillGaps: ['Geometry'], daysAgo: 11 },
  { userId: 'user_morgan', score: 62, skillGaps: ['Algebra'], daysAgo: 2 },
  // Casey (2 results)
  { userId: 'user_casey', score: 55, skillGaps: ['Calculus'], daysAgo: 13 },
  { userId: 'user_casey', score: 58, skillGaps: ['Geometry'], daysAgo: 1 },
  // Riley (2 results)
  { userId: 'user_riley', score: 60, skillGaps: ['Algebra'], daysAgo: 10 },
  { userId: 'user_riley', score: 95, skillGaps: ['Geometry'], daysAgo: 8 },
  // Avery (2 results)
  { userId: 'user_avery', score: 75, skillGaps: ['Calculus'], daysAgo: 9 },
  { userId: 'user_avery', score: 68, skillGaps: ['Algebra'], daysAgo: 5 },
  // Quinn (2 results)
  { userId: 'user_quinn', score: 80, skillGaps: ['Geometry'], daysAgo: 7 },
  { userId: 'user_quinn', score: 72, skillGaps: ['Calculus'], daysAgo: 4 },
  // Cameron (1 result)
  { userId: 'user_cameron', score: 65, skillGaps: ['Algebra'], daysAgo: 6 },
];

// ============================================================================
// CLEAR FUNCTION
// ============================================================================

async function clearExistingData(): Promise<void> {
  console.log('🗑️  Clearing existing seed data...');

  const batchSize = 500;

  // Delete seed users (deterministic IDs)
  console.log('   Clearing users...');
  const seedUserIds = seedUsers.map(u => u.id);
  let batch = db.batch();
  let count = 0;
  for (const userId of seedUserIds) {
    const userRef = db.collection('users').doc(userId);
    batch.delete(userRef);
    count++;
    if (count >= batchSize) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) {
    await batch.commit();
  }

  // Delete all practice results (we'll recreate them)
  console.log('   Clearing practice results...');
  const resultsSnapshot = await db.collection('practice_results').get();
  batch = db.batch();
  count = 0;
  for (const doc of resultsSnapshot.docs) {
    batch.delete(doc.ref);
    count++;
    if (count >= batchSize) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) {
    await batch.commit();
  }

  // Delete seed invites (deterministic short codes seed01-seed25)
  console.log('   Clearing invites...');
  const invitesSnapshot = await db.collection('invites').limit(100).get();
  const seedInviteDocs = invitesSnapshot.docs.filter(doc => {
    const code = doc.data().short_code;
    return code && code >= 'seed01' && code <= 'seed25';
  });
  batch = db.batch();
  count = 0;
  for (const doc of seedInviteDocs) {
    batch.delete(doc.ref);
    count++;
    if (count >= batchSize) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) {
    await batch.commit();
  }

  // Delete all decisions (we'll recreate them)
  console.log('   Clearing decisions...');
  const decisionsSnapshot = await db.collection('decisions').get();
  batch = db.batch();
  count = 0;
  for (const doc of decisionsSnapshot.docs) {
    batch.delete(doc.ref);
    count++;
    if (count >= batchSize) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) {
    await batch.commit();
  }

  // Reset analytics counters (keep document, reset to 0)
  const analyticsDoc = db.collection('analytics_counters').doc('main');
  await analyticsDoc.set({
    total_users: 0,
    total_invites_sent: 0,
    total_invites_opened: 0,
    total_invites_accepted: 0,
    total_fvm_reached: 0,
    last_updated: Timestamp.now(),
  }, { merge: true });

  console.log('✅ Clear complete');
}

// ============================================================================
// TASK 2: CREATE USERS
// ============================================================================

async function createUsers(seedUsers: UserSeedData[]): Promise<string[]> {
  console.log('👥 Creating users...');
  const batch = db.batch();
  const userIds: string[] = [];

  for (const user of seedUsers) {
    const userRef = db.collection('users').doc(user.id);
    const daysAgo = randInt(2, 14);
    
    batch.set(userRef, {
      email: user.email,
      name: user.name,
      xp: user.xp,
      created_at: timestampDaysAgo(daysAgo),
    });

    userIds.push(user.id);
  }

  await batch.commit();
  console.log(`✅ Created ${seedUsers.length} users`);
  return userIds;
}

// ============================================================================
// TASK 3: CREATE PRACTICE RESULTS
// ============================================================================

async function createPracticeResults(
  userIds: string[],
  seedResults: PracticeResultSeedData[]
): Promise<string[]> {
  console.log('📝 Creating practice results...');
  const batch = db.batch();
  const resultIds: string[] = [];

  // Verify all user IDs exist
  const userDocs = await Promise.all(
    userIds.map(id => db.collection('users').doc(id).get())
  );
  const missingUsers = userDocs.filter(doc => !doc.exists).map((_, i) => userIds[i]);
  if (missingUsers.length > 0) {
    throw new Error(`Invalid user IDs: ${missingUsers.join(', ')}`);
  }

  let index = 0;
  for (const result of seedResults) {
    if (!userIds.includes(result.userId)) {
      throw new Error(`Invalid user ID in practice result: ${result.userId}`);
    }

    const resultRef = db.collection('practice_results').doc(`result_${index + 1}`);
    batch.set(resultRef, {
      user_id: result.userId,
      score: result.score,
      skill_gaps: result.skillGaps,
      completed_at: timestampDaysAgo(result.daysAgo),
    });

    resultIds.push(resultRef.id);
    index++;
  }

  await batch.commit();
  console.log(`✅ Created ${seedResults.length} practice results`);
  return resultIds;
}

// ============================================================================
// TASK 4: CREATE INVITES WITH FUNNEL
// ============================================================================

function createPlaceholderQuestions(skill: string, count: number = 5): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `placeholder_${skill.toLowerCase()}_${i + 1}`,
    text: `Sample ${skill} question ${i + 1}`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: i % 4,
    skill: skill,
  }));
}

function generateShareCopy(score: number, skill: string): string {
  if (score >= 80) {
    return `I just crushed ${skill} with ${score}%! Think you can beat me? 😎`;
  } else if (score >= 60) {
    return `I got ${score}% on ${skill}. Can you do better?`;
  } else {
    return `${skill} is tough! I got ${score}%. Want to practice together?`;
  }
}

function extractFirstName(fullName: string): string {
  return fullName.split(' ')[0];
}

async function createInvites(
  userIds: string[],
  resultIds: string[],
  users: UserSeedData[],
  results: PracticeResultSeedData[]
): Promise<any[]> {
  console.log('📨 Creating invites with funnel progression...');

  // Build a map of userId -> resultIds for this user
  const userResultMap = new Map<string, string[]>();
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (!userResultMap.has(result.userId)) {
      userResultMap.set(result.userId, []);
    }
    userResultMap.get(result.userId)!.push(resultIds[i]);
  }

  // Distribution: 8 from active, 10 from moderate, 7 from others
  // Active users: Alex (0), Sam (1), Jordan (2) = 3 users → 8 invites
  // Moderate: Taylor (3), Morgan (4), Casey (5), Riley (6), Avery (7) = 5 users → 10 invites
  // Others: Quinn (8), Cameron (9) = 2 users → 7 invites

  const inviteDistribution = [
    // Active users (8 invites)
    ...Array(3).fill(0), // Alex: 3 invites
    ...Array(3).fill(1), // Sam: 3 invites
    ...Array(2).fill(2), // Jordan: 2 invites
    // Moderate users (10 invites)
    ...Array(3).fill(3), // Taylor: 3 invites
    ...Array(2).fill(4), // Morgan: 2 invites
    ...Array(2).fill(5), // Casey: 2 invites
    ...Array(2).fill(6), // Riley: 2 invites
    ...Array(1).fill(7), // Avery: 1 invite
    // Others (7 invites)
    ...Array(4).fill(8), // Quinn: 4 invites
    ...Array(3).fill(9), // Cameron: 3 invites
  ];

  const invites: any[] = [];
  const userInviteCounts = new Map<string, number>(); // Track how many invites per user

  for (let i = 0; i < 25; i++) {
    const userIndex = inviteDistribution[i];
    const user = users[userIndex];
    const userId = userIds[userIndex];

    // Get user's result IDs
    const userResults = userResultMap.get(userId) || [];
    if (userResults.length === 0) {
      throw new Error(`No practice results found for user ${userId}`);
    }

    // Get the count of invites for this user so far
    const count = userInviteCounts.get(userId) || 0;
    userInviteCounts.set(userId, count + 1);

    // Select a result ID (cycle through user's results)
    const resultId = userResults[count % userResults.length];
    
    // Find the corresponding result data
    const resultIndex = resultIds.indexOf(resultId);
    const result = results[resultIndex];

    // Base timestamp (spread over last 7-14 days)
    const daysAgo = randInt(7, 14);
    const created_at = timestampDaysAgo(daysAgo);

    // Deterministic funnel progression
    // First 20: opened, First 16: accepted, First 14: FVM
    let opened_at: admin.firestore.Timestamp | undefined;
    let accepted_at: admin.firestore.Timestamp | undefined;
    let fvm_reached_at: admin.firestore.Timestamp | undefined;
    let invitee_id: string | undefined;

    if (i < 20) {
      opened_at = timestampHoursFromNow(2, created_at.toDate());
      
      if (i < 16) {
        accepted_at = timestampHoursFromNow(1, opened_at.toDate());
        // Reuse seed users as invitees (cycle through)
        invitee_id = userIds[i % userIds.length];
        
        if (i < 14) {
          fvm_reached_at = timestampHoursFromNow(4, accepted_at.toDate());
        }
      }
    }

    // Get skill from practice result
    const skill = result.skillGaps[0] || 'Algebra';

    // Generate challenge data
    const challenge_data = {
      skill: skill,
      questions: createPlaceholderQuestions(skill, 5),
      share_copy: generateShareCopy(result.score, skill),
      inviter_name: extractFirstName(user.name),
      inviter_score: result.score,
    };

    const invite = {
      short_code: generateShortCode(i + 1),
      inviter_id: userId,
      loop_type: 'buddy_challenge',
      practice_result_id: resultId,
      created_at: created_at,
      opened_at: opened_at,
      accepted_at: accepted_at,
      invitee_id: invitee_id,
      fvm_reached_at: fvm_reached_at,
      challenge_data: challenge_data,
    };

    invites.push(invite);
  }

  // Batch write invites
  const batch = db.batch();
  for (let i = 0; i < invites.length; i++) {
    const inviteRef = db.collection('invites').doc(`invite_${i + 1}`);
    // Remove undefined fields (Firestore doesn't allow undefined)
    const inviteData = Object.fromEntries(
      Object.entries(invites[i]).filter(([_, value]) => value !== undefined)
    );
    batch.set(inviteRef, inviteData);
  }
  await batch.commit();

  const openedCount = invites.filter(i => i.opened_at).length;
  const acceptedCount = invites.filter(i => i.accepted_at).length;
  const fvmCount = invites.filter(i => i.fvm_reached_at).length;

  console.log(`✅ Created ${invites.length} invites`);
  console.log(`   Funnel: ${openedCount} opened, ${acceptedCount} accepted, ${fvmCount} FVM`);
  
  return invites;
}

// ============================================================================
// TASK 5: CREATE DECISION LOGS
// ============================================================================

async function createDecisions(
  userIds: string[],
  resultIds: string[],
  invites: any[],
  results: PracticeResultSeedData[]
): Promise<void> {
  console.log('📋 Creating decision logs...');
  const batch = db.batch();
  let decisionIndex = 0;

  // Create trigger decisions for all invites (25 decisions)
  for (const invite of invites) {
    const resultIdx = resultIds.indexOf(invite.practice_result_id);
    const result = results[resultIdx];
    
    const decisionRef = db.collection('decisions').doc(`decision_${decisionIndex + 1}`);
    batch.set(decisionRef, {
      user_id: invite.inviter_id,
      event_type: 'practice_completed',
      event_id: invite.practice_result_id,
      decision: 'trigger_buddy_challenge',
      rationale: `Score ${result.score}%, eligible for invite (passes orchestrator checks)`,
      features_used: ['score_threshold', 'rate_limit', 'cooldown'],
      context: {
        score: result.score,
        invites_today: randInt(0, 2),
        last_invite_hours_ago: randInt(1, 8),
      },
      created_at: timestampHoursFromNow(-1, invite.created_at.toDate()),
    });
    decisionIndex++;
  }

  // Create skip decisions for results without invites (8 skip decisions)
  // Use results that weren't used for invites or use some duplicate results
  const skipReasons = [
    'Rate limit reached (3/3 invites used today)',
    'Score too low (45%)',
    'Last invite sent 30m ago (cooldown required)',
    'Score below threshold',
    'Daily invite limit exceeded',
  ];

  for (let i = 0; i < 8; i++) {
    const userId = userIds[i % userIds.length];
    const resultId = resultIds[i % resultIds.length];
    const resultIdx = resultIds.indexOf(resultId);
    const result = results[resultIdx] || results[0];

    const decisionRef = db.collection('decisions').doc(`decision_${decisionIndex + 1}`);
    batch.set(decisionRef, {
      user_id: userId,
      event_type: 'practice_completed',
      event_id: resultId,
      decision: 'skip',
      rationale: skipReasons[i % skipReasons.length],
      features_used: ['rate_limit', 'score_threshold', 'cooldown'],
      context: {
        score: result.score < 50 ? result.score : 45,
        invites_today: 3,
        last_invite_hours_ago: 0.5,
      },
      created_at: timestampDaysAgo(randInt(1, 10)),
    });
    decisionIndex++;
  }

  await batch.commit();
  console.log(`✅ Created ${decisionIndex} decision logs`);
}

// ============================================================================
// TASK 6: INITIALIZE ANALYTICS COUNTERS
// ============================================================================

async function initializeCounters(
  users: string[],
  invites: any[]
): Promise<void> {
  console.log('📊 Initializing analytics counters...');

  const total_users = users.length;
  const total_invites_sent = invites.length;
  const total_invites_opened = invites.filter(i => i.opened_at).length;
  const total_invites_accepted = invites.filter(i => i.accepted_at).length;
  const total_fvm_reached = invites.filter(i => i.fvm_reached_at).length;

  const analyticsDoc = db.collection('analytics_counters').doc('main');
  await analyticsDoc.set({
    total_users: total_users,
    total_invites_sent: total_invites_sent,
    total_invites_opened: total_invites_opened,
    total_invites_accepted: total_invites_accepted,
    total_fvm_reached: total_fvm_reached,
    last_updated: Timestamp.now(),
  }, { merge: true });

  console.log('✅ Analytics counters initialized');
  console.log(`   Users: ${total_users}, Sent: ${total_invites_sent}, Opened: ${total_invites_opened}, Accepted: ${total_invites_accepted}, FVM: ${total_fvm_reached}`);
}

// ============================================================================
// TASK 7: VERIFICATION
// ============================================================================

async function verifyKFactor(): Promise<number> {
  console.log('🔍 Verifying K-factor...');
  
  const analyticsDoc = await db.collection('analytics_counters').doc('main').get();
  if (!analyticsDoc.exists) {
    throw new Error('Analytics counters document not found');
  }

  const data = analyticsDoc.data()!;
  const invitesPerUser = data.total_invites_sent / data.total_users;
  const conversionRate = data.total_fvm_reached / data.total_invites_sent;
  const kFactor = invitesPerUser * conversionRate;

  console.log(`   Invites per User: ${invitesPerUser.toFixed(2)}`);
  console.log(`   Conversion Rate: ${(conversionRate * 100).toFixed(1)}%`);
  console.log(`   K-factor: ${kFactor.toFixed(2)} (Target: ≥1.20) ${kFactor >= 1.2 ? '✅' : '❌'}`);

  return kFactor;
}

async function verifyDataRelationships(): Promise<void> {
  console.log('🔍 Verifying data relationships...');

  // Verify invites reference valid users
  // Use simpler query - get all invites and filter by short_code in memory
  const invitesSnapshot = await db.collection('invites').limit(50).get();
  const seedInvites = invitesSnapshot.docs.filter(doc => {
    const code = doc.data().short_code;
    return code && code >= 'seed01' && code <= 'seed25';
  });
  
  const usersSnapshot = await db.collection('users').get();
  const userIds = new Set(usersSnapshot.docs.map(doc => doc.id));

  let invalidRefs = 0;
  for (const invite of seedInvites) {
    const data = invite.data();
    if (!userIds.has(data.inviter_id)) {
      console.error(`   ❌ Invite ${invite.id} references invalid inviter_id: ${data.inviter_id}`);
      invalidRefs++;
    }
    if (data.invitee_id && !userIds.has(data.invitee_id)) {
      console.error(`   ❌ Invite ${invite.id} references invalid invitee_id: ${data.invitee_id}`);
      invalidRefs++;
    }
  }

  if (invalidRefs === 0) {
    console.log(`   ✅ All ${seedInvites.length} invite user references valid`);
  }

  // Verify timestamp ordering
  let timestampErrors = 0;
  for (const invite of seedInvites) {
    const data = invite.data();
    const created = data.created_at?.toMillis() || 0;
    const opened = data.opened_at?.toMillis();
    const accepted = data.accepted_at?.toMillis();
    const fvm = data.fvm_reached_at?.toMillis();
    
    if (opened && opened < created) {
      console.error(`   ❌ Invite ${invite.id}: opened_at before created_at`);
      timestampErrors++;
    }
    if (accepted && opened && accepted < opened) {
      console.error(`   ❌ Invite ${invite.id}: accepted_at before opened_at`);
      timestampErrors++;
    }
    if (fvm && accepted && fvm < accepted) {
      console.error(`   ❌ Invite ${invite.id}: fvm_reached_at before accepted_at`);
      timestampErrors++;
    }
  }

  if (timestampErrors === 0) {
    console.log('   ✅ All timestamps in correct order');
  }

  if (invalidRefs === 0 && timestampErrors === 0) {
    console.log('✅ Data relationships verified');
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function seedDemoData(clearFirst: boolean = false): Promise<void> {
  try {
    // Initialize db now that env vars are loaded
    const { db: firestoreDb } = await import('../src/lib/firebase-admin');
    db = firestoreDb;
    
    console.log('🌱 Starting seed data creation...');
    
    // Check if data exists (simpler check - just query for any seed users or seed invites)
    const usersSnapshot = await db.collection('users').doc('user_alex').get();
    const invitesSnapshot = await db.collection('invites').where('short_code', '==', 'seed01').limit(1).get();
    const hasExistingData = usersSnapshot.exists || !invitesSnapshot.empty;

    if (hasExistingData && !clearFirst) {
      console.warn('⚠️  Existing seed data detected. Use --clear flag to clear first.');
      const shouldProceed = await confirm('Proceed anyway? (this may create duplicates)');
      if (!shouldProceed) {
        console.log('❌ Aborted');
        process.exit(0);
      }
    }

    // 1. Clear existing data (if requested)
    if (clearFirst) {
      const confirmed = await confirm('⚠️  This will delete all seed data. Continue?');
      if (!confirmed) {
        console.log('❌ Aborted');
        process.exit(0);
      }
      await clearExistingData();
    }
    
    // 2. Create users
    const userIds = await createUsers(seedUsers);
    
    // 3. Create practice results
    const resultIds = await createPracticeResults(userIds, seedPracticeResults);
    
    // 4. Create invites with funnel
    const invites = await createInvites(userIds, resultIds, seedUsers, seedPracticeResults);
    
    // 5. Create decision logs
    await createDecisions(userIds, resultIds, invites, seedPracticeResults);
    
    // 6. Initialize analytics counters
    await initializeCounters(userIds, invites);
    
    // 7. Verify K-factor and relationships
    const kFactor = await verifyKFactor();
    await verifyDataRelationships();
    
    console.log('\n🎉 Seed data created successfully!');
    console.log(`   K-factor: ${kFactor.toFixed(2)} (Target: ≥1.20) ${kFactor >= 1.2 ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// ============================================================================
// RUN SCRIPT
// ============================================================================

const clearFirst = process.argv.includes('--clear');
seedDemoData(clearFirst)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


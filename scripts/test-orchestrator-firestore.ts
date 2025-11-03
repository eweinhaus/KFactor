/**
 * Test script for Loop Orchestrator against real Firestore
 * 
 * This script tests the orchestrator functionality by:
 * 1. Creating test data in Firestore
 * 2. Testing orchestrator decisions
 * 3. Verifying decision logs
 * 4. Cleaning up test data
 * 
 * Usage: tsx scripts/test-orchestrator-firestore.ts
 */

// IMPORTANT: Load environment variables FIRST before any Firebase imports
// This must be at the top to ensure env vars are loaded before firebase-admin initializes
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local from project root
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('❌ Error loading .env.local:', result.error);
    process.exit(1);
  }
  console.log('✅ Loaded .env.local');
} else {
  console.error(`❌ .env.local not found at ${envPath}`);
  console.error('   Please create .env.local with FIREBASE_SERVICE_ACCOUNT_KEY');
  process.exit(1);
}

// Debug: Check if service account key is loaded (without showing the actual key)
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables');
  console.error('   Make sure .env.local contains FIREBASE_SERVICE_ACCOUNT_KEY');
  console.error(`   Current env file: ${envPath}`);
  process.exit(1);
}

// Validate service account key format
let parsedServiceAccount;
try {
  parsedServiceAccount = JSON.parse(serviceAccountKey);
  if (!parsedServiceAccount.project_id) {
    console.error('❌ Service account key missing project_id property');
    console.error('   Make sure FIREBASE_SERVICE_ACCOUNT_KEY is a valid JSON string');
    console.error('   Expected format: {"type":"service_account","project_id":"...",...}');
    process.exit(1);
  }
  console.log(`✅ Service account key loaded (project: ${parsedServiceAccount.project_id})`);
} catch (error) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON');
  console.error('   Error:', error instanceof Error ? error.message : String(error));
  console.error('   Make sure the value is a valid JSON string (single line, no newlines)');
  console.error('   The key should start with: {"type":"service_account",...}');
  process.exit(1);
}

// Now safe to import Firebase (env vars are loaded)
// Import admin directly to avoid module-level initialization
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin BEFORE importing anything that uses it
// Use the already-parsed service account
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(parsedServiceAccount),
  });
  console.log('✅ Firebase Admin initialized');
}

// Get Firestore instance
const db = getFirestore();

// Now safe to import modules that use Firebase
import { LoopOrchestrator } from '../src/agents/LoopOrchestrator';
import type { EventContext } from '../src/types';

// Test user IDs
const TEST_USER_ID = 'test_user_orchestrator';
const TEST_RESULT_ID = 'test_result_orchestrator';

/**
 * Clean up test data
 */
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test practice result
    const resultRef = db.collection('practice_results').doc(TEST_RESULT_ID);
    await resultRef.delete().catch(() => {});
    
    // Delete test invites
    const invitesSnapshot = await db.collection('invites')
      .where('inviter_id', '==', TEST_USER_ID)
      .get();
    
    const inviteDeletes = invitesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(inviteDeletes);
    
    // Delete test decisions
    const decisionsSnapshot = await db.collection('decisions')
      .where('user_id', '==', TEST_USER_ID)
      .get();
    
    const decisionDeletes = decisionsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(decisionDeletes);
    
    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('⚠️  Cleanup error (may not exist):', error);
  }
}

/**
 * Create test practice result
 */
async function createTestPracticeResult(score: number) {
  const resultRef = db.collection('practice_results').doc(TEST_RESULT_ID);
  
  await resultRef.set({
    user_id: TEST_USER_ID,
    score: score,
    skill_gaps: ['Algebra', 'Geometry'],
    completed_at: new Date(),
  });
  
  console.log(`✅ Created test practice result: score=${score}%`);
}

/**
 * Test orchestrator decision
 */
async function testOrchestratorDecision(
  testName: string,
  score: number,
  expectedTrigger: boolean,
  expectedRationale: string
) {
  console.log(`\n📋 Test: ${testName}`);
  console.log(`   Score: ${score}%`);
  console.log(`   Expected: shouldTrigger=${expectedTrigger}`);
  
  // Create test practice result
  await createTestPracticeResult(score);
  
  // Create orchestrator
  const orchestrator = new LoopOrchestrator(db);
  
  // Create event context
  const eventContext: EventContext = {
    type: 'practice_completed',
    resultId: TEST_RESULT_ID,
    score: score,
    skillGaps: ['Algebra', 'Geometry'],
  };
  
  // Make decision
  const startTime = Date.now();
  const decision = await orchestrator.decide(TEST_USER_ID, eventContext);
  const elapsed = Date.now() - startTime;
  
  // Verify decision
  const passed = decision.shouldTrigger === expectedTrigger;
  const rationaleMatch = decision.rationale.toLowerCase().includes(expectedRationale.toLowerCase());
  
  console.log(`   Result: shouldTrigger=${decision.shouldTrigger}`);
  console.log(`   Rationale: ${decision.rationale}`);
  console.log(`   Features: ${decision.features_used.join(', ')}`);
  console.log(`   Decision ID: ${decision.decisionId}`);
  console.log(`   Performance: ${elapsed}ms ${elapsed > 150 ? '⚠️  (exceeds 150ms target)' : '✅'}`);
  
  if (passed && rationaleMatch) {
    console.log(`   ✅ PASS`);
  } else {
    console.log(`   ❌ FAIL`);
    if (!passed) console.log(`      Expected shouldTrigger=${expectedTrigger}, got ${decision.shouldTrigger}`);
    if (!rationaleMatch) console.log(`      Rationale doesn't match expected: ${expectedRationale}`);
  }
  
  // Verify decision was logged
  if (decision.decisionId && decision.decisionId !== 'log_failed') {
    const decisionDoc = await db.collection('decisions').doc(decision.decisionId).get();
    if (decisionDoc.exists) {
      console.log(`   ✅ Decision logged to Firestore`);
    } else {
      console.log(`   ⚠️  Decision ID returned but document not found`);
    }
  }
  
  return passed && rationaleMatch;
}

/**
 * Test rate limiting
 */
async function testRateLimiting() {
  console.log(`\n📋 Test: Rate Limiting (3 invites/day)`);
  
  // Create test practice result
  await createTestPracticeResult(75);
  
  // Create 3 invites for today (to hit rate limit)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const invitesRef = db.collection('invites');
  const invitePromises = [];
  
  for (let i = 0; i < 3; i++) {
    invitePromises.push(
      invitesRef.add({
        inviter_id: TEST_USER_ID,
        short_code: `test${i}`,
        loop_type: 'buddy_challenge',
        created_at: new Date(today.getTime() + i * 3600000), // 1 hour apart
        challenge_data: {
          skill: 'Algebra',
          questions: [],
          share_copy: 'Test',
        },
      })
    );
  }
  
  await Promise.all(invitePromises);
  console.log('✅ Created 3 invites for today');
  
  // Test orchestrator (should be rate limited)
  const orchestrator = new LoopOrchestrator(db);
  const eventContext: EventContext = {
    type: 'practice_completed',
    resultId: TEST_RESULT_ID,
    score: 75,
    skillGaps: ['Algebra'],
  };
  
  const decision = await orchestrator.decide(TEST_USER_ID, eventContext);
  
  const passed = !decision.shouldTrigger && 
                 decision.rationale.toLowerCase().includes('rate limit');
  
  console.log(`   Result: shouldTrigger=${decision.shouldTrigger}`);
  console.log(`   Rationale: ${decision.rationale}`);
  
  if (passed) {
    console.log(`   ✅ PASS - Rate limit correctly enforced`);
  } else {
    console.log(`   ❌ FAIL - Rate limit not enforced`);
  }
  
  // Clean up invites
  const invitesSnapshot = await db.collection('invites')
    .where('inviter_id', '==', TEST_USER_ID)
    .get();
  
  const inviteDeletes = invitesSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(inviteDeletes);
  
  return passed;
}

/**
 * Test cooldown period
 */
async function testCooldownPeriod() {
  console.log(`\n📋 Test: Cooldown Period (1 hour)`);
  
  // Create test practice result
  await createTestPracticeResult(80);
  
  // Create invite 30 minutes ago (should trigger cooldown)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  await db.collection('invites').add({
    inviter_id: TEST_USER_ID,
    short_code: 'test_cooldown',
    loop_type: 'buddy_challenge',
    created_at: thirtyMinutesAgo,
    challenge_data: {
      skill: 'Algebra',
      questions: [],
      share_copy: 'Test',
    },
  });
  
  console.log('✅ Created invite 30 minutes ago');
  
  // Test orchestrator (should be in cooldown)
  const orchestrator = new LoopOrchestrator(db);
  const eventContext: EventContext = {
    type: 'practice_completed',
    resultId: TEST_RESULT_ID,
    score: 80,
    skillGaps: ['Algebra'],
  };
  
  const decision = await orchestrator.decide(TEST_USER_ID, eventContext);
  
  // Check if error is due to missing index
  const isIndexError = decision.rationale.toLowerCase().includes('no previous invites') && 
                       !decision.rationale.toLowerCase().includes('cooldown');
  
  const passed = !decision.shouldTrigger && 
                 decision.rationale.toLowerCase().includes('cooldown');
  
  console.log(`   Result: shouldTrigger=${decision.shouldTrigger}`);
  console.log(`   Rationale: ${decision.rationale}`);
  
  if (isIndexError) {
    console.log(`   ⚠️  SKIP - Firestore index not deployed (required for cooldown check)`);
    console.log(`   Deploy indexes: npm run deploy:firestore`);
    return false; // Mark as failed but with clear reason
  } else if (passed) {
    console.log(`   ✅ PASS - Cooldown correctly enforced`);
  } else {
    console.log(`   ❌ FAIL - Cooldown not enforced`);
  }
  
  // Clean up invite
  const invitesSnapshot = await db.collection('invites')
    .where('inviter_id', '==', TEST_USER_ID)
    .get();
  
  const inviteDeletes = invitesSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(inviteDeletes);
  
  return passed;
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Orchestrator Firestore Tests\n');
  console.log('📍 Testing against real Firestore project');
  console.log(`   Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'k-factor-4634e'}\n`);
  
  let testsPassed = 0;
  let testsTotal = 0;
  
  try {
    // Clean up any existing test data
    await cleanupTestData();
    
    // Test 1: High score should trigger
    testsTotal++;
    if (await testOrchestratorDecision(
      'High Score (75%) - Should Trigger',
      75,
      true,
      'score'
    )) testsPassed++;
    
    // Test 2: Low score should not trigger
    testsTotal++;
    if (await testOrchestratorDecision(
      'Low Score (45%) - Should Not Trigger',
      45,
      false,
      'score too low'
    )) testsPassed++;
    
    // Test 3: Boundary score (50%) should trigger
    testsTotal++;
    if (await testOrchestratorDecision(
      'Boundary Score (50%) - Should Trigger',
      50,
      true,
      'score'
    )) testsPassed++;
    
    // Test 4: Rate limiting
    testsTotal++;
    if (await testRateLimiting()) testsPassed++;
    
    // Test 5: Cooldown period
    testsTotal++;
    if (await testCooldownPeriod()) testsPassed++;
    
    // Final cleanup
    await cleanupTestData();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Test Summary: ${testsPassed}/${testsTotal} tests passed`);
    console.log('='.repeat(60));
    
    if (testsPassed === testsTotal) {
      console.log('✅ All tests passed!');
      process.exit(0);
    } else {
      console.log(`❌ ${testsTotal - testsPassed} test(s) failed`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    await cleanupTestData();
    process.exit(1);
  }
}

// Run tests
runTests();


/**
 * Check Firestore Index Status
 * 
 * This script checks the status of Firestore indexes to see if they're built.
 * 
 * Usage: tsx scripts/check-firestore-indexes.ts
 */

// IMPORTANT: Load environment variables FIRST before any Firebase imports
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
  process.exit(1);
}

// Validate service account key
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found');
  process.exit(1);
}

let parsedServiceAccount;
try {
  parsedServiceAccount = JSON.parse(serviceAccountKey);
  if (!parsedServiceAccount.project_id) {
    console.error('❌ Service account key missing project_id');
    process.exit(1);
  }
  console.log(`✅ Service account key loaded (project: ${parsedServiceAccount.project_id})`);
} catch (error) {
  console.error('❌ Failed to parse service account key');
  process.exit(1);
}

// Now safe to import Firebase
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(parsedServiceAccount),
  });
}

const db = getFirestore();

/**
 * Check if indexes are deployed and built
 */
async function checkIndexes() {
  console.log('\n🔍 Checking Firestore Indexes...\n');
  
  try {
    // Try the query that requires the index
    console.log('Testing query: invites where inviter_id == test_user, orderBy created_at DESC');
    
    const testQuery = db
      .collection('invites')
      .where('inviter_id', '==', 'test_index_check')
      .orderBy('created_at', 'desc')
      .limit(1);
    
    try {
      await testQuery.get();
      console.log('✅ Query succeeded - Index is working!');
      return true;
    } catch (error: any) {
      if (error?.code === 9 || error?.message?.includes('index')) {
        console.log('❌ Query failed - Index not ready or missing');
        console.log('\nError details:');
        console.log(`  Code: ${error.code}`);
        console.log(`  Message: ${error.message}`);
        
        if (error.details) {
          console.log(`\n📋 Index creation link:`);
          console.log(`  ${error.details}`);
        }
        
        console.log('\n💡 Solutions:');
        console.log('  1. Deploy indexes: npm run deploy:firestore');
        console.log('  2. Wait 5-10 minutes for indexes to build');
        console.log('  3. Check Firebase Console: https://console.firebase.google.com/project/k-factor-4634e/firestore/indexes');
        console.log('  4. Verify index status shows "Enabled" (not "Building")');
        
        return false;
      } else {
        // Other error (not index-related)
        console.log('⚠️  Query failed with different error:', error.message);
        return true; // Index might be fine, just no data
      }
    }
  } catch (error: any) {
    console.error('❌ Error checking indexes:', error);
    return false;
  }
}

// Run check
checkIndexes()
  .then((indexReady) => {
    if (indexReady) {
      console.log('\n✅ Index check complete - Indexes are ready!');
      process.exit(0);
    } else {
      console.log('\n❌ Index check complete - Indexes need to be deployed/built');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Index check failed:', error);
    process.exit(1);
  });


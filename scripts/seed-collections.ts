/**
 * Seed script to create Firestore collections and initial documents
 * Run with: npm run seed
 */

import admin from 'firebase-admin';
import { db } from '../src/lib/firebase-admin';

async function seedCollections() {
  console.log('🌱 Seeding Firestore collections...');

  try {
    // Create analytics_counters/main document
    console.log('📊 Creating analytics_counters collection...');
    const analyticsDoc = db.collection('analytics_counters').doc('main');
    const analyticsExists = (await analyticsDoc.get()).exists;

    if (!analyticsExists) {
      await analyticsDoc.set({
        total_users: 0,
        total_invites_sent: 0,
        total_invites_opened: 0,
        total_invites_accepted: 0,
        total_fvm_reached: 0,
        last_updated: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ Created analytics_counters/main document');
    } else {
      console.log('ℹ️  analytics_counters/main already exists');
    }

    // Create placeholder documents to initialize collections
    // (Firestore doesn't require collections to exist before writing)
    // But we'll create empty documents that can be deleted later

    console.log('📁 Collections ready:');
    console.log('  - users (created when first user is added)');
    console.log('  - practice_results (created when first result is added)');
    console.log('  - invites (created when first invite is sent)');
    console.log('  - decisions (created when first decision is made)');
    console.log('  - analytics_counters (main document created)');

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding collections:', error);
    process.exit(1);
  }
}

seedCollections();


/**
 * Firebase Emulator Helper
 * Provides utilities for testing with Firebase emulators
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase-admin/firestore';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';

/**
 * Initialize Firebase Admin with emulator
 * Call this in test setup files
 */
export function initializeFirebaseEmulator() {
  if (getApps().length === 0) {
    // Use a dummy service account for emulator
    const serviceAccount = {
      projectId: 'demo-test',
      privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n',
      clientEmail: 'test@demo-test.iam.gserviceaccount.com',
    };

    initializeApp({
      credential: cert(serviceAccount as any),
      projectId: 'demo-test',
    });

    const db = getFirestore();
    
    // Connect to emulator
    try {
      connectFirestoreEmulator(db as any, 'localhost', 8080);
    } catch (error) {
      // Emulator already connected, ignore
      console.log('Firestore emulator connection:', error);
    }

    return db;
  }

  return getFirestore();
}

/**
 * Clear all Firestore data (for test cleanup)
 */
export async function clearFirestoreData(db: any) {
  const collections = ['users', 'practice_results', 'invites', 'decisions', 'analytics_counters'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }
}

/**
 * Check if emulator is running
 */
export function isEmulatorRunning(): boolean {
  return !!process.env.FIRESTORE_EMULATOR_HOST || process.env.CI === 'true';
}



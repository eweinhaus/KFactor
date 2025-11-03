import admin from 'firebase-admin';
import { getFirestore, connectFirestoreEmulator } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Get Firestore instance
const db = getFirestore();

// Connect to emulator if FIRESTORE_EMULATOR_HOST is set
// This must be done before any Firestore operations
if (process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  try {
    connectFirestoreEmulator(db, host || 'localhost', parseInt(port || '8080', 10));
  } catch (error: any) {
    // Emulator already connected or connection failed, ignore
    // This is safe to ignore - if emulator is already connected, operations will work
  }
}

export { db };



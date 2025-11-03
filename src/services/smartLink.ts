import { db } from '@/lib/firebase-admin';

/**
 * Generates a random short code (6 alphanumeric characters)
 * 
 * @returns 6-character lowercase alphanumeric code
 */
export function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6; // 6-8 characters (start with 6)
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code.toLowerCase(); // Case-insensitive
}

/**
 * Checks if a short code is unique in Firestore
 * 
 * @param code - Short code to check
 * @returns true if unique, false if collision detected
 */
export async function checkShortCodeUnique(code: string): Promise<boolean> {
  try {
    // Normalize to lowercase
    const normalizedCode = code.toLowerCase();
    
    // Query Firestore invites collection for existing short_code
    const invitesSnapshot = await db
      .collection('invites')
      .where('short_code', '==', normalizedCode)
      .limit(1)
      .get();
    
    // Return true if no documents found (unique)
    return invitesSnapshot.empty;
  } catch (error) {
    console.error('Error checking short code uniqueness:', error);
    // On error, assume not unique (safer to retry)
    return false;
  }
}

/**
 * Generates a unique short code with collision handling
 * Retries up to maxRetries times if collisions occur
 * 
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @returns Unique short code
 * @throws Error if all retries fail
 */
export async function generateUniqueShortCode(maxRetries: number = 5): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateShortCode();
    const isUnique = await checkShortCodeUnique(code);
    
    if (isUnique) {
      return code;
    }
    
    // Collision detected, will retry
    if (attempt < maxRetries - 1) {
      console.warn(`Short code collision detected (attempt ${attempt + 1}/${maxRetries}), retrying...`);
    }
  }
  
  // All retries failed
  throw new Error('collision_error: Could not generate unique short code after 5 attempts');
}

/**
 * Builds the full share URL from a short code
 * 
 * @param shortCode - Short code to build URL for
 * @returns Full URL (e.g., "http://localhost:3000/invite/abc123")
 */
export function buildShareUrl(shortCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/invite/${shortCode}`;
}


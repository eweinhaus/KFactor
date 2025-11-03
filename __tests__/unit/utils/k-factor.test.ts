/**
 * K-Factor Calculation Tests
 */

import { describe, it, expect } from 'vitest';

/**
 * Calculate K-factor from metrics
 * K-factor = (Invites per User) × (Conversion Rate)
 * Where:
 * - Invites per User = total_invites_sent / total_users
 * - Conversion Rate = total_fvm_reached / total_invites_sent
 */
function calculateKFactor(
  invitesSent: number,
  users: number,
  fvmReached: number
): number {
  if (users === 0 || invitesSent === 0) {
    return 0;
  }
  const invitesPerUser = invitesSent / users;
  const conversionRate = fvmReached / invitesSent;
  return invitesPerUser * conversionRate;
}

describe('K-Factor Calculation', () => {
  it('calculates correctly for seed data', () => {
    // Seed data: 25 invites, 10 users, 14 FVM
    const kFactor = calculateKFactor(25, 10, 14);
    expect(kFactor).toBeCloseTo(1.4, 2);
  });

  it('handles perfect viral growth', () => {
    // 2 invites per user, 100% conversion = 2.0 K-factor
    const kFactor = calculateKFactor(20, 10, 20);
    expect(kFactor).toBe(2.0);
  });

  it('handles zero users', () => {
    const kFactor = calculateKFactor(10, 0, 5);
    expect(kFactor).toBe(0);
  });

  it('handles zero invites', () => {
    const kFactor = calculateKFactor(0, 10, 0);
    expect(kFactor).toBe(0);
  });

  it('handles low conversion rate', () => {
    // 10 invites, 10 users, but only 1 FVM = 0.1 K-factor
    const kFactor = calculateKFactor(10, 10, 1);
    expect(kFactor).toBe(0.1);
  });

  it('verifies target threshold (≥1.20)', () => {
    const kFactor = calculateKFactor(25, 10, 14);
    expect(kFactor).toBeGreaterThanOrEqual(1.2);
  });

  it('handles edge case: exactly 1.20', () => {
    // Actually: 12 invites, 10 users, 10 FVM
    // Invites per user = 12/10 = 1.2
    // Conversion = 10/12 = 0.833...
    // K-factor = 1.2 × 0.833... = 1.0
    // Let's use: 12 invites, 10 users, 12 FVM = 1.44
    // Or better: 10 invites, 10 users, 12 FVM (can't have more FVM than invites)
    // Use: 24 invites, 10 users, 12 FVM = 2.4 × 0.5 = 1.2
    const kFactor = calculateKFactor(24, 10, 12);
    expect(kFactor).toBeCloseTo(1.2, 2);
  });
});


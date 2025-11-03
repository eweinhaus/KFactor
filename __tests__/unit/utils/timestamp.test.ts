/**
 * Timestamp Utility Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Generate timestamp for N days ago
 */
function timestampDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Generate timestamp for N hours from a base date
 */
function timestampHoursFromNow(hours: number, fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);
  date.setHours(date.getHours() + hours);
  return date;
}

describe('Timestamp Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates timestamp for 1 day ago', () => {
    const now = new Date('2025-01-21T12:00:00Z');
    vi.setSystemTime(now);

    const oneDayAgo = timestampDaysAgo(1);
    const expected = new Date('2025-01-20T12:00:00Z');

    expect(oneDayAgo.getTime()).toBe(expected.getTime());
  });

  it('generates timestamp for 14 days ago', () => {
    const now = new Date('2025-01-21T12:00:00Z');
    vi.setSystemTime(now);

    const fourteenDaysAgo = timestampDaysAgo(14);
    const expected = new Date('2025-01-07T12:00:00Z');

    expect(fourteenDaysAgo.getTime()).toBe(expected.getTime());
  });

  it('generates timestamp for 2 hours from now', () => {
    const baseDate = new Date('2025-01-21T12:00:00Z');
    vi.setSystemTime(baseDate);

    const twoHoursLater = timestampHoursFromNow(2, baseDate);
    const expected = new Date('2025-01-21T14:00:00Z');

    expect(twoHoursLater.getTime()).toBe(expected.getTime());
  });

  it('generates timestamp for 4 hours from base date', () => {
    const baseDate = new Date('2025-01-21T10:00:00Z');

    const fourHoursLater = timestampHoursFromNow(4, baseDate);
    const expected = new Date('2025-01-21T14:00:00Z');

    expect(fourHoursLater.getTime()).toBe(expected.getTime());
  });

  it('handles timestamp ordering correctly', () => {
    const baseDate = new Date('2025-01-21T10:00:00Z');
    const created = baseDate;
    const opened = timestampHoursFromNow(2, baseDate);
    const accepted = timestampHoursFromNow(1, opened);
    const fvm = timestampHoursFromNow(4, accepted);

    // Verify ordering: created < opened < accepted < fvm
    expect(created.getTime()).toBeLessThan(opened.getTime());
    expect(opened.getTime()).toBeLessThan(accepted.getTime());
    expect(accepted.getTime()).toBeLessThan(fvm.getTime());
  });

  it('handles edge case: 0 days ago', () => {
    const now = new Date('2025-01-21T12:00:00Z');
    vi.setSystemTime(now);

    const zeroDaysAgo = timestampDaysAgo(0);
    expect(zeroDaysAgo.getTime()).toBe(now.getTime());
  });

  it('handles edge case: 0 hours from now', () => {
    const baseDate = new Date('2025-01-21T12:00:00Z');
    const zeroHoursLater = timestampHoursFromNow(0, baseDate);
    expect(zeroHoursLater.getTime()).toBe(baseDate.getTime());
  });
});


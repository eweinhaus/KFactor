/**
 * E2E Tests: Challenge Acceptance Flow
 * Tests the complete flow from landing page to acceptance
 */

import { test, expect } from '@playwright/test';

test.describe('Challenge Acceptance Flow', () => {
  // Helper function to create test invite via API
  async function createTestInvite(page: any) {
    // First, we need to create a practice result and then an invite
    // For E2E, we'll use the API directly or seed data
    
    // This is a simplified version - in real scenario, you'd call the API
    // For now, we'll assume seed data exists or create via API
    const response = await page.request.post('http://localhost:3000/api/invite/create', {
      data: {
        userId: 'user_alex',
        resultId: 'result_1', // Assuming this exists from seed data
      },
    });

    if (response.ok()) {
      const data = await response.json();
      return data.shortCode;
    }

    // Fallback: use a known short code from seed data
    // Seed data has invite_1 with short_code 'abc123'
    return 'abc123';
  }

  test('complete flow: landing → accept → redirect', async ({ page }) => {
    // Navigate to landing page with a short code
    // Using seed data short code 'abc123' (from seed script)
    const shortCode = 'abc123';
    
    await page.goto(`/invite/${shortCode}`);

    // Verify landing page content
    await expect(page.locator('h1')).toContainText('challenged you');
    await expect(page.locator('text=Algebra')).toBeVisible();
    await expect(page.locator('text=5')).toBeVisible(); // Question count

    // Click Accept Challenge button
    await page.click('button:has-text("Accept Challenge")');

    // Verify modal opens
    await expect(page.locator('text=Start Challenge')).toBeVisible();

    // Fill in form
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');

    // Submit form
    await page.click('button:has-text("Start Challenge")');

    // Verify redirect to challenge page (Phase 7 placeholder)
    // For now, check that we're redirected (URL pattern)
    await expect(page).toHaveURL(/\/challenge\/.+/);
  });

  test('shows 404 for invalid short code', async ({ page }) => {
    await page.goto('/invite/invalid123');
    
    // Should show 404 page
    await expect(page.locator('text=404')).toBeVisible();
  });

  test('shows error for already accepted invite', async ({ page }) => {
    // This test requires an invite that's already been accepted
    // We'll use a known accepted invite from seed data, or create one via API
    
    // For now, we'll test the error message display
    // Navigate to a valid invite first
    const shortCode = 'abc123';
    await page.goto(`/invite/${shortCode}`);

    // Click Accept Challenge
    await page.click('button:has-text("Accept Challenge")');

    // Fill and submit form first time
    await page.fill('input[type="text"]', 'First User');
    await page.fill('input[type="email"]', 'first@example.com');
    await page.click('button:has-text("Start Challenge")');

    // Wait for redirect or error
    await page.waitForTimeout(1000);

    // Try to accept again with different user (if invite still exists)
    // Note: This is a simplified test - in real scenario, you'd need to
    // create a new invite that's already accepted
    await page.goto(`/invite/${shortCode}`);
    
    // If modal opens, try to submit again
    const modalVisible = await page.locator('text=Start Challenge').isVisible().catch(() => false);
    if (modalVisible) {
      await page.fill('input[type="text"]', 'Second User');
      await page.fill('input[type="email"]', 'second@example.com');
      await page.click('button:has-text("Start Challenge")');
      
      // Should show error message
      await expect(page.locator('text=already been accepted')).toBeVisible();
    }
  });

  test('validates form inputs', async ({ page }) => {
    const shortCode = 'abc123';
    await page.goto(`/invite/${shortCode}`);

    // Click Accept Challenge
    await page.click('button:has-text("Accept Challenge")');

    // Try to submit without name
    await page.click('button:has-text("Start Challenge")');
    
    // Submit button should be disabled or form should show validation
    const submitButton = page.locator('button:has-text("Start Challenge")');
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('displays challenge details correctly', async ({ page }) => {
    const shortCode = 'abc123';
    await page.goto(`/invite/${shortCode}`);

    // Verify all challenge details are displayed
    await expect(page.locator('text=challenged you')).toBeVisible();
    await expect(page.locator('text=Subject:')).toBeVisible();
    await expect(page.locator('text=Questions:')).toBeVisible();
    await expect(page.locator('text=Time:')).toBeVisible();
    await expect(page.locator('text=Score:')).toBeVisible();
  });
});


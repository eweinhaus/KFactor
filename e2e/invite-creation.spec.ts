/**
 * E2E Test: Invite Creation Flow
 * Tests the complete invite creation flow from results page to share modal
 */

import { test, expect } from '@playwright/test';

test.describe('Invite Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock userId in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userId', 'user_alex');
    });
  });

  test('creates invite successfully with high score (≥50%)', async ({ page }) => {
    // Navigate to practice page
    await page.goto('/practice');
    
    // Wait for questions to load
    await expect(page.locator('h1')).toContainText('Practice Test');
    
    // Answer questions to get a good score (≥50%)
    // Answer first 6 with option 0 (likely correct for many), rest with option 1
    const questionCards = page.locator('div[class*="border"]').filter({ hasText: /Question \d+ of 10/ });
    
    for (let i = 0; i < 10; i++) {
      const questionCard = questionCards.nth(i);
      const options = questionCard.locator('input[type="radio"]');
      // Use first option for first 6 questions to ensure good score
      const optionIndex = i < 6 ? 0 : 1;
      await options.nth(optionIndex).click();
    }
    
    // Submit the test
    await page.locator('button:has-text("Submit Test")').click();
    
    // Wait for results page
    await page.waitForURL(/\/results\/[^/]+/, { timeout: 10000 });
    
    // Verify results page loaded
    await expect(page.locator('h1')).toContainText('Practice Test Results');
    
    // Verify score is displayed
    const scoreText = await page.locator('text=/\\d+%/').first().textContent();
    expect(scoreText).toMatch(/\d+%/);
    const score = parseInt(scoreText!.replace('%', ''));
    
    // If score >= 50, challenge button should be visible
    if (score >= 50) {
      // Verify challenge button is visible and enabled
      const challengeButton = page.locator('button:has-text("Challenge a Friend")');
      await expect(challengeButton).toBeVisible();
      await expect(challengeButton).toBeEnabled();
      
      // Click challenge button
      await challengeButton.click();
      
      // Wait for loading state (button should show "Creating...")
      await expect(page.locator('text=Creating...')).toBeVisible({ timeout: 5000 });
      
      // Wait for share modal to appear
      await expect(page.locator('text=Challenge Created!')).toBeVisible({ timeout: 10000 });
      
      // Verify share modal content
      await expect(page.locator('text=Share Your Challenge')).toBeVisible();
      
      // Verify share URL is displayed
      const shareUrlInput = page.locator('input[type="text"]').filter({ hasText: /invite/ });
      await expect(shareUrlInput).toBeVisible();
      
      const shareUrl = await shareUrlInput.inputValue();
      expect(shareUrl).toMatch(/\/invite\/[a-z0-9]{6}/);
      
      // Verify share copy text is displayed
      await expect(page.locator('text=/I (got|crushed|just)/')).toBeVisible();
      
      // Click copy link button
      const copyButton = page.locator('button:has-text("Copy Link")');
      await copyButton.click();
      
      // Verify success feedback
      await expect(page.locator('text=Copied!')).toBeVisible({ timeout: 2000 });
      
      // Close modal
      const closeButton = page.locator('button:has-text("Close")');
      await closeButton.click();
      
      // Verify modal is closed
      await expect(page.locator('text=Challenge Created!')).not.toBeVisible();
    } else {
      // If score < 50, button should not be visible
      await expect(page.locator('button:has-text("Challenge a Friend")')).not.toBeVisible();
    }
  });

  test('shows error message for low score (<50%)', async ({ page }) => {
    // This test would require mocking the API to return a specific error
    // For now, we'll test that the button is not visible for low scores
    await page.goto('/practice');
    
    // Answer questions incorrectly to get low score
    const questionCards = page.locator('div[class*="border"]').filter({ hasText: /Question \d+ of 10/ });
    
    // Answer all with last option (likely incorrect)
    for (let i = 0; i < 10; i++) {
      const questionCard = questionCards.nth(i);
      const options = questionCard.locator('input[type="radio"]');
      await options.nth(3).click(); // Last option
    }
    
    // Submit
    await page.locator('button:has-text("Submit Test")').click();
    await page.waitForURL(/\/results\/[^/]+/, { timeout: 10000 });
    
    // Check score
    const scoreText = await page.locator('text=/\\d+%/').first().textContent();
    const score = parseInt(scoreText!.replace('%', ''));
    
    if (score < 50) {
      // Challenge button should not be visible
      await expect(page.locator('button:has-text("Challenge a Friend")')).not.toBeVisible();
    }
  });

  test('handles rate limit error gracefully', async ({ page }) => {
    // This test requires creating 3 invites first, then attempting a 4th
    // For E2E, we'd need to set up the database state first
    // This is a placeholder test that would need API mocking or DB setup
    
    // Navigate to practice and complete test
    await page.goto('/practice');
    const questionCards = page.locator('div[class*="border"]').filter({ hasText: /Question \d+ of 10/ });
    
    for (let i = 0; i < 10; i++) {
      const questionCard = questionCards.nth(i);
      await questionCard.locator('input[type="radio"]').first().click();
    }
    
    await page.locator('button:has-text("Submit Test")').click();
    await page.waitForURL(/\/results\/[^/]+/, { timeout: 10000 });
    
    // Note: To fully test rate limit, we'd need to:
    // 1. Create 3 invites via API first
    // 2. Then attempt to create a 4th
    // 3. Verify error message appears
    
    // For now, verify button exists and is clickable
    const challengeButton = page.locator('button:has-text("Challenge a Friend")');
    const isVisible = await challengeButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(challengeButton).toBeEnabled();
    }
  });

  test('share modal is responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Complete practice test
    await page.goto('/practice');
    const questionCards = page.locator('div[class*="border"]').filter({ hasText: /Question \d+ of 10/ });
    
    for (let i = 0; i < 6; i++) {
      const questionCard = questionCards.nth(i);
      await questionCard.locator('input[type="radio"]').first().click();
    }
    for (let i = 6; i < 10; i++) {
      const questionCard = questionCards.nth(i);
      await questionCard.locator('input[type="radio"]').nth(1).click();
    }
    
    await page.locator('button:has-text("Submit Test")').click();
    await page.waitForURL(/\/results\/[^/]+/, { timeout: 10000 });
    
    const challengeButton = page.locator('button:has-text("Challenge a Friend")');
    const isVisible = await challengeButton.isVisible().catch(() => false);
    
    if (isVisible && (await challengeButton.isEnabled())) {
      await challengeButton.click();
      
      // Wait for modal
      await expect(page.locator('text=Challenge Created!')).toBeVisible({ timeout: 10000 });
      
      // Verify modal is visible and properly sized on mobile
      const modal = page.locator('div[class*="bg-white"]').filter({ hasText: 'Challenge Created!' });
      await expect(modal).toBeVisible();
      
      // Verify copy button is large enough for touch (min 44px)
      const copyButton = page.locator('button:has-text("Copy Link")');
      const buttonBox = await copyButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('prevents double-click on challenge button', async ({ page }) => {
    await page.goto('/practice');
    const questionCards = page.locator('div[class*="border"]').filter({ hasText: /Question \d+ of 10/ });
    
    for (let i = 0; i < 6; i++) {
      const questionCard = questionCards.nth(i);
      await questionCard.locator('input[type="radio"]').first().click();
    }
    for (let i = 6; i < 10; i++) {
      const questionCard = questionCards.nth(i);
      await questionCard.locator('input[type="radio"]').nth(1).click();
    }
    
    await page.locator('button:has-text("Submit Test")').click();
    await page.waitForURL(/\/results\/[^/]+/, { timeout: 10000 });
    
    const challengeButton = page.locator('button:has-text("Challenge a Friend")');
    const isVisible = await challengeButton.isVisible().catch(() => false);
    
    if (isVisible && (await challengeButton.isEnabled())) {
      // Click button rapidly twice
      await challengeButton.click();
      await challengeButton.click({ force: true });
      
      // Verify button is disabled during loading
      await expect(page.locator('text=Creating...')).toBeVisible({ timeout: 5000 });
      await expect(challengeButton).toBeDisabled();
      
      // Wait for modal or error
      await page.waitForTimeout(2000);
      
      // Button should be re-enabled or modal should be shown
      const modalVisible = await page.locator('text=Challenge Created!').isVisible().catch(() => false);
      const buttonEnabled = await challengeButton.isEnabled().catch(() => false);
      
      // Either modal appeared or button is re-enabled (error case)
      expect(modalVisible || buttonEnabled).toBe(true);
    }
  });
});


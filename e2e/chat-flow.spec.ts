import { test, expect } from '@playwright/test';

test.describe('Chat with Living Memory E2E', () => {
  test('complete chat flow with memory creation and citation', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Should redirect to sign in page since not authenticated
    await expect(page).toHaveURL(/auth\/signin/);

    // For this test, we'll mock the authentication
    // In a real scenario, you'd implement proper auth flow
    
    // Mock being logged in by setting up the page state
    await page.evaluate(() => {
      // Mock session data
      window.localStorage.setItem('nextauth.session-token', 'mock-token');
    });

    // Navigate to chat page
    await page.goto('/chat');

    // Wait for the chat interface to load
    await expect(page.getByText('Welcome to Living Memory Chat')).toBeVisible();

    // Create a new conversation
    await page.getByText('New Chat').click();

    // Send a message about living in Paris and loving hiking
    const messageInput = page.getByPlaceholder('Type your message...');
    await messageInput.fill('I live in Paris and love hiking in the mountains');
    await page.getByRole('button', { name: 'Send' }).click();

    // Check that the message appears
    await expect(page.getByText('I live in Paris and love hiking')).toBeVisible();

    // Wait for memory extraction indicator
    await expect(page.getByText('extracting memory...')).toBeVisible();

    // Wait for memory activity to appear (this would happen after async processing)
    // In a real test, you might need to wait longer or mock the API response
    await page.waitForTimeout(3000);

    // Send a follow-up question
    await messageInput.fill('Where do I live?');
    await page.getByRole('button', { name: 'Send' }).click();

    // Check that the AI responds with information about Paris
    // This would require the AI to use retrieved memories
    await expect(page.getByText(/Paris/i)).toBeVisible();

    // Check for memory citations in the response
    await expect(page.locator('[title*="Referenced Memory"]')).toBeVisible();

    // Click on memory activity chip to view details
    const activityChip = page.locator('button').filter({ hasText: /\+\d+/ });
    if (await activityChip.isVisible()) {
      await activityChip.click();
      await expect(page.getByText('Memory Activity')).toBeVisible();
    }

    // Navigate to memories library
    await page.getByText('Memories Library').click();
    await expect(page).toHaveURL(/memories/);

    // Check that memories are listed
    await expect(page.getByText('Memories Library')).toBeVisible();
    
    // Search for memories
    const searchInput = page.getByPlaceholder('Search memories...');
    await searchInput.fill('Paris');
    
    // Should show filtered results
    await expect(page.locator('[data-testid="memory-card"]')).toBeVisible();
  });

  test('memory management operations', async ({ page }) => {
    // This test would cover editing and deleting memories
    await page.goto('/memories');
    
    // Mock being logged in
    await page.evaluate(() => {
      window.localStorage.setItem('nextauth.session-token', 'mock-token');
    });

    await page.reload();

    // Wait for memories to load
    await expect(page.getByText('Memories Library')).toBeVisible();

    // Test editing a memory (if memories exist)
    const editButton = page.getByRole('button', { name: 'Edit' }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page.getByText('Edit Memory')).toBeVisible();
      
      const textarea = page.getByRole('textbox');
      await textarea.fill('Updated memory text');
      await page.getByText('Save Changes').click();
      
      await expect(page.getByText('Updated memory text')).toBeVisible();
    }

    // Test deleting a memory
    const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      // Memory should be removed from the list
    }
  });
});
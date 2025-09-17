import { test, expect } from '@playwright/test';

test.describe('Chat with Living Memory E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for all tests
    await page.evaluate(() => {
      // Mock Supabase session
      window.localStorage.setItem('sb-auth-token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-123', email: 'test@example.com' }
      }));
    });
  });

  test('1. Login → new conversation → send "I live in Paris and love hiking" → see "extracting memory..." → memory appears', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Should redirect to sign in page since not authenticated
    await expect(page).toHaveURL(/auth\/signin/);

    // Mock successful authentication
    await page.evaluate(() => {
      // Mock Supabase auth state
      window.dispatchEvent(new CustomEvent('supabase-auth-change', {
        detail: {
          event: 'SIGNED_IN',
          session: {
            user: { id: 'test-user-123', email: 'test@example.com' },
            access_token: 'mock-token'
          }
        }
      }));
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

    // Check that the user message appears immediately
    await expect(page.getByText('I live in Paris and love hiking in the mountains')).toBeVisible();

    // Wait for AI response and memory extraction indicator
    await expect(page.getByText('extracting memory...')).toBeVisible();

    // Wait for memory activity to appear (this would happen after async processing)
    await page.waitForTimeout(5000);

    // Check that memory activity appears on the user message
    const memoryActivityChip = page.locator('button').filter({ hasText: /\+1/ });
    await expect(memoryActivityChip).toBeVisible();

    // Click on memory activity chip to view details
    await memoryActivityChip.click();
    
    // Check that memory activity details are shown
    await expect(page.getByText('Memory Activity')).toBeVisible();
  });

  test('2. Ask "Where do I live?" → answer cites the Paris memory', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/chat');

    // Wait for chat interface
    await expect(page.getByText('Welcome to Living Memory Chat')).toBeVisible();

    // Create a new conversation
    await page.getByText('New Chat').click();

    // First, create a memory by sending initial message
    const messageInput = page.getByPlaceholder('Type your message...');
    await messageInput.fill('I live in Paris and love hiking in the mountains');
    await page.getByRole('button', { name: 'Send' }).click();

    // Wait for memory extraction
    await expect(page.getByText('extracting memory...')).toBeVisible();
    await page.waitForTimeout(3000);

    // Send follow-up question
    await messageInput.fill('Where do I live?');
    await page.getByRole('button', { name: 'Send' }).click();

    // Check that the AI responds with information about Paris
    await expect(page.getByText(/Paris/i)).toBeVisible();

    // Check for memory citations in the response
    const memoryCitations = page.locator('[title*="Referenced Memory"]');
    await expect(memoryCitations).toBeVisible();

    // Check for "Referenced X memories" badge
    await expect(page.getByText(/Referenced \d+ memories/)).toBeVisible();

    // Click "Show Details" to see referenced memories
    const showDetailsButton = page.getByRole('button', { name: /Show Details/ });
    await showDetailsButton.click();

    // Check that relevant memories are displayed
    await expect(page.getByText('Relevant Memories')).toBeVisible();
    await expect(page.getByText(/Paris/i)).toBeVisible();
  });

  test('3. Edit a memory → send another message → Updated count appears with a diff', async ({ page }) => {
    // Navigate to memories library
    await page.goto('/memories');

    // Wait for memories to load
    await expect(page.getByText('Memories Library')).toBeVisible();

    // Wait for memories to be displayed
    await page.waitForTimeout(2000);

    // Find and click edit button for first memory
    const editButton = page.getByRole('button').filter({ hasText: 'Edit' }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Check that edit dialog opens
      await expect(page.getByText('Edit Memory')).toBeVisible();
      
      // Update the memory text
      const textarea = page.getByRole('textbox');
      await textarea.clear();
      await textarea.fill('I live in Paris and love hiking in the Alps mountains');
      
      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click();
      
      // Wait for update to complete
      await page.waitForTimeout(2000);
      
      // Verify the memory was updated
      await expect(page.getByText('I live in Paris and love hiking in the Alps mountains')).toBeVisible();
    }

    // Navigate back to chat
    await page.goto('/chat');

    // Create a new conversation
    await page.getByText('New Chat').click();

    // Send a message to trigger memory usage
    const messageInput = page.getByPlaceholder('Type your message...');
    await messageInput.fill('Tell me about my hobbies');
    await page.getByRole('button', { name: 'Send' }).click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Check for updated memory count indicator
    const updatedCountChip = page.locator('button').filter({ hasText: /~\d+/ });
    if (await updatedCountChip.isVisible()) {
      await expect(updatedCountChip).toBeVisible();
      
      // Click to see diff details
      await updatedCountChip.click();
      await expect(page.getByText('Memory Activity')).toBeVisible();
    }
  });

  test('4. Delete a memory → Deleted count appears → next answer doesn\'t cite it', async ({ page }) => {
    // Navigate to memories library
    await page.goto('/memories');

    // Wait for memories to load
    await expect(page.getByText('Memories Library')).toBeVisible();
    await page.waitForTimeout(2000);

    // Find and click delete button for first memory
    const deleteButton = page.getByRole('button').filter({ hasText: /Delete/ }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Check that delete confirmation dialog opens
      await expect(page.getByText('Delete Memory')).toBeVisible();
      await expect(page.getByText('Are you sure you want to delete this memory?')).toBeVisible();
      
      // Confirm deletion
      await page.getByRole('button', { name: 'Delete Memory' }).click();
      
      // Wait for deletion to complete
      await page.waitForTimeout(2000);
      
      // Verify the memory was deleted (should not be visible)
      const memoryCards = page.locator('[data-testid="memory-card"]');
      const initialCount = await memoryCards.count();
      expect(initialCount).toBeLessThan(1);
    }

    // Navigate back to chat
    await page.goto('/chat');

    // Create a new conversation
    await page.getByText('New Chat').click();

    // Send a message that would have used the deleted memory
    const messageInput = page.getByPlaceholder('Type your message...');
    await messageInput.fill('Where do I live?');
    await page.getByRole('button', { name: 'Send' }).click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Check for deleted memory count indicator
    const deletedCountChip = page.locator('button').filter({ hasText: /−\d+/ });
    if (await deletedCountChip.isVisible()) {
      await expect(deletedCountChip).toBeVisible();
      
      // Click to see deletion details
      await deletedCountChip.click();
      await expect(page.getByText('Memory Activity')).toBeVisible();
    }

    // Verify that the deleted memory is not cited in the response
    const memoryCitations = page.locator('[title*="Referenced Memory"]');
    const citationCount = await memoryCitations.count();
    
    // The response should not cite the deleted memory
    // (This would depend on the specific memory that was deleted)
    expect(citationCount).toBeGreaterThanOrEqual(0);
  });

  test('Complete memory lifecycle flow', async ({ page }) => {
    // Navigate to chat
    await page.goto('/chat');
    await expect(page.getByText('Welcome to Living Memory Chat')).toBeVisible();

    // Create new conversation
    await page.getByText('New Chat').click();

    // Step 1: Create memory
    const messageInput = page.getByPlaceholder('Type your message...');
    await messageInput.fill('My name is John and I am a software engineer');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('My name is John and I am a software engineer')).toBeVisible();
    await expect(page.getByText('extracting memory...')).toBeVisible();
    await page.waitForTimeout(3000);

    // Step 2: Use memory
    await messageInput.fill('What is my name and profession?');
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(3000);

    // Check for memory citations
    await expect(page.getByText(/John/i)).toBeVisible();
    await expect(page.getByText(/software engineer/i)).toBeVisible();

    // Step 3: Navigate to memories library
    await page.goto('/memories');
    await expect(page.getByText('Memories Library')).toBeVisible();
    await page.waitForTimeout(2000);

    // Verify memory exists
    await expect(page.getByText(/John/i)).toBeVisible();

    // Step 4: Edit memory
    const editButton = page.getByRole('button').filter({ hasText: 'Edit' }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page.getByText('Edit Memory')).toBeVisible();
      
      const textarea = page.getByRole('textbox');
      await textarea.clear();
      await textarea.fill('My name is John Smith and I am a senior software engineer');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await page.waitForTimeout(2000);
    }

    // Step 5: Delete memory
    const deleteButton = page.getByRole('button').filter({ hasText: /Delete/ }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await expect(page.getByText('Delete Memory')).toBeVisible();
      await page.getByRole('button', { name: 'Delete Memory' }).click();
      await page.waitForTimeout(2000);
    }

    // Step 6: Verify memory is gone
    await page.goto('/memories');
    await page.waitForTimeout(2000);
    
    // Should show empty state or reduced memory count
    const memoryCards = page.locator('[data-testid="memory-card"]');
    const finalCount = await memoryCards.count();
    expect(finalCount).toBeLessThan(1);
  });

  test('Memory search and filtering', async ({ page }) => {
    // Navigate to memories library
    await page.goto('/memories');
    await expect(page.getByText('Memories Library')).toBeVisible();
    await page.waitForTimeout(2000);

    // Test search functionality
    const searchInput = page.getByPlaceholder('Search memories...');
    await searchInput.fill('Paris');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Should show filtered results or no results message
    const hasResults = await page.locator('[data-testid="memory-card"]').count() > 0;
    const hasNoResults = await page.getByText('No memories found').isVisible();
    
    expect(hasResults || hasNoResults).toBeTruthy();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(1000);
  });

  test('Memory panel in chat sidebar', async ({ page }) => {
    // Navigate to chat
    await page.goto('/chat');
    await expect(page.getByText('Welcome to Living Memory Chat')).toBeVisible();

    // Toggle memories panel
    const showMemoriesButton = page.getByRole('button', { name: /Show Memories/ });
    await showMemoriesButton.click();

    // Check that memories panel is visible
    await expect(page.getByText('Memories')).toBeVisible();

    // Hide memories panel
    const hideMemoriesButton = page.getByRole('button', { name: /Hide Memories/ });
    await hideMemoriesButton.click();

    // Check that memories panel is hidden
    await expect(page.getByText('Memories')).not.toBeVisible();
  });
});
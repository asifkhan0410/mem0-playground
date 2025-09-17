# Testing Guide

This document outlines the comprehensive testing strategy for the Mem0 Chat Application.

## Test Structure

### Unit Tests (`__tests__/`)
- **Mem0 API Wrapper** (`mem0.test.ts`) - Tests for memory operations, search/filter builder, and diff utility
- **Cache Service** (`cache.test.ts`) - Tests for caching layer functionality
- **Component Tests**:
  - `conversations-sidebar.test.tsx` - Conversations list functionality
  - `memories-panel.test.tsx` - Memories panel with search and filters
  - `relevant-memories.test.tsx` - Citation chips and memory references

### E2E Tests (`e2e/`)
- **Complete Memory Lifecycle** (`chat-flow.spec.ts`) - Full user journey testing

### Test Utilities (`__tests__/utils/`)
- `test-helpers.ts` - Mock data factories, API responses, and assertion helpers

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### All Tests
```bash
# Run both unit and E2E tests
npm run test:all
```

## Test Coverage

### Unit Tests Coverage

#### Mem0 API Wrapper (`mem0.test.ts`)
- ✅ **Memory Operations**: Add, update, delete memory
- ✅ **Search and Filter Builder**: Search with caching, different limits
- ✅ **Memory Retrieval**: Get by ID, get all memories
- ✅ **Diff Utility**: Date conversion, timestamp handling
- ✅ **Error Handling**: Client initialization failure, API errors
- ✅ **Caching Integration**: Cache hits/misses, invalidation

#### Cache Service (`cache.test.ts`)
- ✅ **Search Results Caching**: Store/retrieve, user isolation
- ✅ **All Memories Caching**: Store/retrieve, pagination
- ✅ **Cache Invalidation**: User-specific, memory-specific
- ✅ **Cache Statistics**: Stats, clear all
- ✅ **Error Handling**: Null inputs, malformed data

#### Component Tests

**Conversations Sidebar (`conversations-sidebar.test.tsx`)**
- ✅ **Rendering**: Conversations list, selected state
- ✅ **Interactions**: Click handlers, edit/delete
- ✅ **Empty States**: No conversations
- ✅ **User Display**: Email in header
- ✅ **Keyboard Navigation**: Enter/Space keys

**Memories Panel (`memories-panel.test.tsx`)**
- ✅ **Rendering**: Memories list, loading states
- ✅ **Search Functionality**: Query handling, results
- ✅ **Empty States**: No memories, no search results
- ✅ **Memory Activity**: New memories count, callbacks
- ✅ **Refresh**: Manual refresh button

**Relevant Memories (`relevant-memories.test.tsx`)**
- ✅ **Rendering**: Memory cards, scores, indices
- ✅ **Color Coding**: Score-based styling
- ✅ **Loading States**: Shimmer effects
- ✅ **Interactions**: Close button, dialog behavior
- ✅ **Error Handling**: Empty responses, fetch errors

### E2E Tests Coverage

#### Complete Memory Lifecycle (`chat-flow.spec.ts`)

**Test 1: Memory Creation**
```typescript
Login → new conversation → send "I live in Paris and love hiking" → 
see "extracting memory..." → memory appears
```
- ✅ Authentication flow
- ✅ New conversation creation
- ✅ Message sending with immediate display
- ✅ Memory extraction indicator
- ✅ Memory activity chip appearance

**Test 2: Memory Citation**
```typescript
Ask "Where do I live?" → answer cites the Paris memory
```
- ✅ Memory creation setup
- ✅ Follow-up question
- ✅ AI response with memory citation
- ✅ Memory reference badges
- ✅ Relevant memories display

**Test 3: Memory Editing**
```typescript
Edit a memory → send another message → Updated count appears with a diff
```
- ✅ Memory library navigation
- ✅ Edit dialog interaction
- ✅ Memory text update
- ✅ Updated count indicator
- ✅ Diff details display

**Test 4: Memory Deletion**
```typescript
Delete a memory → Deleted count appears → next answer doesn't cite it
```
- ✅ Delete confirmation dialog
- ✅ Memory deletion
- ✅ Deleted count indicator
- ✅ Verification of non-citation

**Additional E2E Tests**
- ✅ **Complete Memory Lifecycle Flow**: Full CRUD operations
- ✅ **Memory Search and Filtering**: Search functionality
- ✅ **Memory Panel in Chat**: Toggle visibility

## Test Data and Mocking

### Mock Data Factories
```typescript
// Create mock memory
const memory = createMockMemory({
  text: 'I live in Paris',
  score: 0.9
});

// Create mock conversation
const conversation = createMockConversation({
  title: 'Test Chat'
});

// Create mock message
const message = createMockMessage({
  content: 'Hello world!',
  role: 'user'
});
```

### API Response Mocks
```typescript
// Mock search results
const searchResponse = mockMemorySearchResponse(memories);

// Mock memory activity
const activityResponse = mockMemoryActivityResponse({
  added: 1,
  updated: 0,
  deleted: 0
});

// Mock OpenAI response
const openaiResponse = mockOpenAIResponse(
  'You live in Paris.',
  ['memory-id-123']
);
```

### Authentication Mocking
```typescript
// Mock Supabase auth
const authMock = mockSupabaseAuth();

// Mock fetch responses
mockFetch([
  {
    url: '/api/memories',
    response: { memories: mockMemories }
  }
]);
```

## Test Assertions

### Memory Display Assertions
```typescript
// Check memory is displayed
expectMemoryToBeDisplayed(screen, memory);

// Check memory activity chip
expectMemoryActivityChip(screen, 1, 0, 0); // +1 added

// Check memory citations
expectMemoryCitations(screen, 2); // 2 citations
```

### Component Behavior Assertions
```typescript
// Check loading states
expect(screen.getByTestId('shimmer-card')).toBeInTheDocument();

// Check empty states
expect(screen.getByText('No memories yet')).toBeInTheDocument();

// Check error handling
expect(screen.getByText('Error loading memories')).toBeInTheDocument();
```

## Best Practices

### Unit Tests
1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies (APIs, services)
3. **Coverage**: Test happy paths, error cases, and edge cases
4. **Assertions**: Use specific, meaningful assertions
5. **Cleanup**: Clear mocks between tests

### E2E Tests
1. **User Journey**: Test complete user workflows
2. **Realistic Data**: Use realistic test data
3. **Wait Strategies**: Use proper wait conditions
4. **Error Scenarios**: Test error handling and recovery
5. **Cross-browser**: Test on multiple browsers

### Test Organization
1. **Grouping**: Group related tests in describe blocks
2. **Naming**: Use descriptive test names
3. **Setup**: Use beforeEach/afterEach for common setup
4. **Helpers**: Create reusable test utilities
5. **Documentation**: Document complex test scenarios

## Continuous Integration

### GitHub Actions
```yaml
# Run tests on every PR
- name: Run Unit Tests
  run: npm run test:unit

- name: Run E2E Tests
  run: npm run test:e2e

- name: Generate Coverage Report
  run: npm run test:coverage
```

### Test Reports
- **Unit Test Coverage**: HTML reports in `coverage/`
- **E2E Test Reports**: Playwright HTML reports
- **Test Results**: JUnit XML for CI integration

## Debugging Tests

### Unit Test Debugging
```bash
# Run specific test file
npm run test:unit -- mem0.test.ts

# Run with verbose output
npm run test:unit -- --reporter=verbose

# Debug mode
npm run test:unit -- --inspect-brk
```

### E2E Test Debugging
```bash
# Run with UI
npm run test:e2e:ui

# Run specific test
npm run test:e2e -- --grep "memory creation"

# Debug mode
npm run test:e2e -- --debug
```

## Performance Testing

### Unit Test Performance
- **Fast Execution**: Unit tests should run quickly (< 1s per test)
- **Parallel Execution**: Tests run in parallel by default
- **Memory Usage**: Monitor memory usage in CI

### E2E Test Performance
- **Timeout Management**: Set appropriate timeouts
- **Resource Cleanup**: Clean up resources after tests
- **Parallel Workers**: Use multiple workers for faster execution

## Future Enhancements

### Planned Test Additions
- [ ] **API Route Tests**: Test individual API endpoints
- [ ] **Database Tests**: Test database operations
- [ ] **Performance Tests**: Load testing for memory operations
- [ ] **Accessibility Tests**: WCAG compliance testing
- [ ] **Visual Regression Tests**: Screenshot comparisons

### Test Infrastructure Improvements
- [ ] **Test Data Seeding**: Automated test data setup
- [ ] **Test Environment**: Dedicated test database
- [ ] **Mock Server**: Centralized API mocking
- [ ] **Test Analytics**: Test execution metrics
- [ ] **Automated Test Generation**: AI-assisted test creation

## Contributing

### Adding New Tests
1. **Follow Patterns**: Use existing test patterns
2. **Update Documentation**: Update this guide
3. **Test Coverage**: Ensure adequate coverage
4. **Review Process**: Include test review in PRs

### Test Maintenance
1. **Regular Updates**: Keep tests current with code changes
2. **Performance Monitoring**: Monitor test execution times
3. **Flaky Test Management**: Address flaky tests promptly
4. **Coverage Goals**: Maintain >80% test coverage

# Test Suite Documentation

## Overview

This directory contains all test files for the KFactor MVP project.

## Test Structure

```
__tests__/
├── helpers/
│   ├── setup.ts              # Vitest setup (env vars, etc.)
│   ├── firebase-emulator.ts  # Firebase emulator utilities
│   └── test-data.ts          # Reusable test fixtures (TODO)
├── unit/
│   └── utils/
│       ├── k-factor.test.ts        # K-factor calculation tests
│       ├── score-calculation.test.ts # Score calculation tests
│       ├── skill-gaps.test.ts      # Skill gap identification tests
│       ├── share-copy.test.ts      # Share copy generation tests
│       ├── short-code.test.ts      # Short code generation tests
│       ├── timestamp.test.ts       # Timestamp utility tests
│       └── eligibility.test.ts     # Eligibility check tests
└── integration/              # TODO: API route tests
    └── api/
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests (watch mode)
npm run test

# Run once and exit
npm run test -- --run

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### All Tests
```bash
npm run test:all
```

## Test Coverage

Current coverage focuses on:
- ✅ K-factor calculation (100% coverage)
- ✅ Score calculation logic
- ✅ Skill gap identification
- ✅ Share copy generation
- ✅ Short code generation
- ✅ Timestamp utilities
- ✅ Eligibility checks

## Firebase Emulator

For integration tests, use the Firebase emulator:

```bash
# Start emulator
npm run emulator

# In another terminal, run tests
npm run test
```

The emulator runs on:
- Firestore: `localhost:8080`
- Emulator UI: `http://localhost:4000`

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    const result = functionUnderTest();
    expect(result).toBe(expected);
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeFirebaseEmulator, clearFirestoreData } from '../helpers/firebase-emulator';

describe('API Route', () => {
  let db: any;

  beforeEach(async () => {
    db = initializeFirebaseEmulator();
  });

  afterEach(async () => {
    await clearFirestoreData(db);
  });

  it('should handle request', async () => {
    // Test implementation
  });
});
```

## Test Best Practices

1. **Test Critical Paths First**
   - K-factor calculation
   - Viral loop flow
   - API endpoints

2. **Keep Tests Fast**
   - Unit tests: <100ms each
   - Integration: <1s each

3. **Use Test Fixtures**
   - Reusable test data
   - Consistent test users

4. **Test Edge Cases**
   - Rate limits
   - Invalid inputs
   - Empty states
   - Error conditions

5. **Isolate Tests**
   - Each test independent
   - Clean up after tests
   - Use Firebase emulator (not real DB)

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests

See `.github/workflows/test.yml` for configuration.



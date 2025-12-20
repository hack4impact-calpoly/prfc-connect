# Testing

## Commands

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E tests
npm run test:e2e:ui   # Interactive Playwright UI
```

## Structure

```
test/
├── mocks/        # Mock implementations
├── actions/      # Server Action tests
├── api/          # API route tests
├── schema/       # Zod schema tests
├── services/     # Service layer tests
├── team/         # Onboarding exercise tests
└── utils/        # Utility function tests

e2e/              # Playwright end-to-end tests
```

## Mocks

Database and external services are mocked in `test/mocks/`:

- `prisma.ts` - Database mock with DeepMockProxy
- `email.ts` - Email service mock
- `rate-limit.ts` - Rate limiter mock
- `csrf.ts` - CSRF protection mock
- `idempotency.ts` - Idempotency key mock
- `request.ts` - NextRequest factory for API tests
- `referrals.ts` - Test fixtures (Peanuts characters)
- `index.ts` - Re-exports all mocks

Import mocks at the top of test files:

```typescript
import { prismaMock } from "../mocks/prisma";
```

## Writing Tests

Mirror the `src/` structure. If you're testing `src/services/referral.ts`, create `test/services/referral.test.ts`.

Use `@jest-environment node` for server-side code (services, API routes). Components use the default jsdom environment.

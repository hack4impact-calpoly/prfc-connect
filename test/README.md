# Testing

## Commands

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ui       # Vitest browser UI
npm run test:e2e      # Playwright E2E tests
npm run test:e2e:ui   # Interactive Playwright UI
```

## Structure

```
test/
├── mocks/        # Mock implementations and fixtures
├── actions/      # Server Action tests
├── api/          # API route tests
├── auth/         # Auth and session tests
├── components/   # React component tests (jsdom)
├── lib/          # Library tests (encryption, dal, tokens, ...)
├── schema/       # Zod schema tests
├── services/     # Service layer tests
└── utils/        # Utility function tests

e2e/              # Playwright end-to-end tests
```

## Mocks

Database and external services are mocked in `test/mocks/`. The main ones:

- `prisma.ts` - Prisma client mock (vitest-mock-extended)
- `dal.ts` - `verifySession` and `requireAdmin`
- `email.ts` - email send mock
- `csrf.ts` - request-guard mock
- `encryption.ts` - identity encrypt/decrypt for deterministic tests
- `request.ts` - NextRequest factory for API tests
- `referrals.ts`, `members.ts`, `events.ts` - fixtures

Most service and lib modules have a matching mock here. Import the specific ones a test needs:

```typescript
import { prismaMock } from "../mocks/prisma";
```

## Writing Tests

Mirror the `src/` structure. If you're testing `src/services/referral.ts`, create `test/services/referral.test.ts`.

Server-side tests run in the node environment and component tests run in jsdom. `vitest.config.mts` defines two Vitest projects: the `node` project includes `test/services`, `test/actions`, `test/api`, `test/auth`, `test/lib`, and `test/utils/errors.test.ts`, and the `jsdom` project covers the rest.

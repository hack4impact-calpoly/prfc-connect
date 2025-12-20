# Source Directory

## Structure

```
src/
├── app/              # Next.js App Router
│   ├── (public)/     # No auth required
│   ├── (protected)/  # Auth required
│   └── api/          # API endpoints
├── actions/          # Server Actions
├── components/       # React components
│   ├── ui/           # shadcn/ui primitives
│   ├── layout/       # Header, navigation
│   └── referral/     # Referral feature components
├── generated/        # Prisma client (auto-generated)
├── hooks/            # Custom React hooks
├── lib/              # Core utilities
├── schema/           # Zod validation schemas
├── services/         # Business logic
├── utils/            # Helper functions
└── env.ts            # Environment variable validation
```

## Naming

Files and folders use `kebab-case`.

## How Things Connect

![Source Flow](../docs/figures/source-flow.png)

Zod schemas in `schema/` validate data at each layer. Types are inferred from schemas. Don't create separate type files.

## Route Groups

Parentheses create route groups without affecting the URL:

- `(public)/` - No auth required
- `(protected)/` - Auth required

Both render at their actual path: `(protected)/referral-database` -> `/referral-database`.

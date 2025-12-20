# Style Guide

Code should be self-documenting. Clear names and types eliminate the need for most comments.

## File Size

Keep files under 250 lines. If a file exceeds this, split it into smaller, focused modules.

## Single Responsibility

Each file does one thing:

| Type      | Responsibility                         |
| --------- | -------------------------------------- |
| Component | Renders UI for one feature             |
| Hook      | Manages one piece of state or behavior |
| Service   | Handles one domain (referrals, email)  |
| Schema    | Defines types for one domain           |
| Utility   | Solves one specific problem            |

## Naming

**Files:** `kebab-case`

```
referral-form.tsx
use-referrals.ts
rate-limit.ts
```

**Code:**

| Type             | Convention      | Example                                  |
| ---------------- | --------------- | ---------------------------------------- |
| Components       | PascalCase      | `ReferralForm`, `DataTable`              |
| Functions        | camelCase       | `getAllReferrals`, `handleSubmit`        |
| Variables        | camelCase       | `referralCode`, `isLoading`              |
| Types/Interfaces | PascalCase      | `ApiReferral`, `CreateReferral`          |
| Hooks            | `use` prefix    | `useReferrals`, `useMobile`              |
| Zod schemas      | `Schema` suffix | `ReferralSchema`, `CreateReferralSchema` |
| Error codes      | SCREAMING_SNAKE | `VALIDATION_ERROR`, `NOT_FOUND`          |

## Imports

Order imports by source:

```typescript
"use client"; // or "server-only"

import { useState } from "react"; // 1. React
import { useRouter } from "next/navigation"; // 2. Next.js
import { z } from "zod"; // 3. External packages
import { Button } from "@/components/ui/button"; // 4. Internal (@/)
```

## Types

Infer types from Zod schemas. Don't create separate type files.

```typescript
// schema/referral.ts
export const ReferralSchema = z.object({
  id: z.number(),
  memberName: z.string(),
  // ...
});

export type Referral = z.infer<typeof ReferralSchema>;
```

## Error Handling

Use `AppError` for business logic errors. Wrap service functions with `transformError()`.

```typescript
// Throwing errors
throw new AppError("NOT_FOUND", `Referral with id ${id} not found`);

// Service pattern
export async function getReferralById(id: number) {
  try {
    const referral = await prisma.referral.findUnique({ where: { id } });
    if (!referral) {
      throw new AppError("NOT_FOUND", `Referral with id ${id} not found`);
    }
    return referral;
  } catch (error) {
    throw transformError(error);
  }
}
```

Error codes are defined in `schema/error.ts`. Add new codes there, not inline.

## Comments

Write comments only when the code can't explain itself:

- Complex business logic
- Non-obvious workarounds
- External constraints

Don't comment:

- What the code does (the code shows that)
- Function parameters (types show that)
- Obvious logic

```typescript
// Bad
// Get all referrals from database
export async function getAllReferrals() { ... }

// Good - no comment needed, function name is clear
export async function getAllReferrals() { ... }

// Good - explains why, not what
// Prisma doesn't support bulk create with returning, use transaction
return await prisma.$transaction(
  referrals.map((data) => prisma.referral.create({ data }))
);
```

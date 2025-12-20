# Server Actions for Mutations

**Date:** December 2025

## Context

The application had API routes handling both reads and writes. Form submissions went through `POST /api/referral`, requiring separate fetch calls and manual error handling.

Next.js 15 stabilized Server Actions as a first-class pattern for mutations.

## Decision

Use Server Actions for all mutations. Keep API routes only for external integrations and reads.

## Alternatives Considered

- **Keep API routes for everything**: Works, but requires more boilerplate. Fetch calls, JSON parsing, error handling all need to be wired up manually.

- **tRPC**: Adds type safety across the client-server boundary, but it's another dependency and learning curve for a student team.

## Consequences

**Benefits:**

- Co-located with forms—action lives next to the UI that calls it
- Automatic `revalidatePath()` for cache invalidation
- Progressive enhancement—forms work without JavaScript
- Less boilerplate than fetch + API route

**Trade-offs:**

- Can't call Server Actions from external clients (use API routes for that)
- Debugging is different—errors show in server logs, not network tab

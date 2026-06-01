# Server Actions for Mutations

**Date:** December 2025

## Context

The app needed a consistent pattern for mutations. Internal, authenticated mutations carried a lot of fetch-plus-API-route boilerplate, with manual error handling on the client. The public referral submission is a separate case: it is an unauthenticated entry point that the Weebly site posts to, so it stays an API route (`POST /api/referrals`).

Next.js 15 stabilized Server Actions as a first-class pattern for mutations.

## Decision

Use Server Actions for internal authenticated mutations (groups, events, messages, settings). Keep API routes for the public referral submission and for external integrations and reads.

## Alternatives Considered

- **Keep API routes for everything**: Works, but requires more boilerplate. Fetch calls, JSON parsing, error handling all need to be wired up manually.

- **tRPC**: Adds type safety across the client-server boundary, but it's another dependency and learning curve for a student team.

## Consequences

**Benefits:**

- Co-located with forms, so the action lives next to the UI that calls it
- Automatic `revalidatePath()` for cache invalidation
- Progressive enhancement, so forms work without JavaScript
- Less boilerplate than fetch + API route

**Trade-offs:**

- Can't call Server Actions from external clients (use API routes for that)
- Debugging is different, since errors show in server logs, not the network tab

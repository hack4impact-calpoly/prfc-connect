# Prisma with MySQL

**Date:** December 2025

## Context

The original referral system used MongoDB with Mongoose. We needed to rebuild the application with a database that would integrate with PRFC's existing infrastructure.

The co-op's server uses MySQL with a `tblowner` table of member records, which Contact Groups reference for membership and messaging.

## Decision

Use Prisma ORM with MySQL.

## Alternatives Considered

- **Keep MongoDB/Mongoose**: Would require syncing data between two different database systems. More complexity, more failure points.

- **PostgreSQL**: Good option, but PRFC's production server runs MySQL. Matching databases simplifies the handoff.

- **Direct MySQL queries**: Prisma provides type safety, migrations, and a cleaner API. Worth the abstraction.

## Consequences

**Benefits:**

- Same database engine as production
- Type-safe queries with generated client
- Migrations tracked in version control
- Prisma Studio for visual database inspection

**Trade-offs:**

- Learning curve for developers unfamiliar with Prisma
- Generated client adds to node_modules size

# Prisma with MySQL

**Date:** December 2025

## Context

The original referral system used MongoDB with Mongoose. We needed to rebuild the application with a database that would integrate with PRFC's existing infrastructure.

The co-op's server runs MariaDB 5.5 (a MySQL-compatible fork) with a `tblowner` table of member records, which Contact Groups reference for membership and messaging.

## Decision

Use Prisma ORM with MySQL.

## Alternatives Considered

- **Keep MongoDB/Mongoose**: Would require syncing data between two different database systems. More complexity, more failure points.

- **PostgreSQL**: Good option, but PRFC's production server runs MySQL. Matching databases simplifies the handoff.

- **Direct MySQL queries**: Prisma provides type safety, migrations, and a cleaner API. Worth the abstraction.

## Consequences

**Benefits:**

- Same MySQL dialect as production
- Type-safe queries with generated client
- Migrations tracked in version control
- Prisma Studio for visual database inspection

**Trade-offs:**

- Learning curve for developers unfamiliar with Prisma
- Generated client adds to node_modules size
- Production runs MariaDB 5.5, below Prisma's documented floor, so Prisma 7 connects through the `@prisma/adapter-mariadb` driver adapter (`src/lib/db.ts`), and the production tables are created by hand from a generated `utf8mb4` DDL script rather than by `prisma migrate deploy`. Migrations still run against Docker MySQL locally and in CI.

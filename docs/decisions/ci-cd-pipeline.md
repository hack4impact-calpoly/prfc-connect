# GitHub Actions CI/CD

**Date:** December 2025

## Context

The project needed automated checks to catch issues before code reaches the main branch. With 10-12 student developers, manual verification doesn't scale.

## Decision

Use GitHub Actions with this pipeline order:

1. **Lint** - ESLint catches style and syntax issues
2. **Type check** - TypeScript catches type errors
3. **Build** - Verifies production build works
4. **Test** - Vitest runs unit and integration tests

Checks run on every push and pull request. Cheap checks run first so failures are caught quickly.

## Alternatives Considered

- **Vercel CI only**: Handles preview deployments but doesn't run tests or type checking. Not enough.

- **CircleCI**: Good tool, but GitHub Actions is native to where the code lives. One less integration to manage.

- **No CI**: Relies on developers running checks locally. They won't always remember.

## Consequences

**Benefits:**

- Free for public repos (2,000 minutes/month for private)
- Students learn industry-standard DevOps
- Branch protection prevents merging broken code

**Trade-offs:**

- Requires MySQL service container for tests

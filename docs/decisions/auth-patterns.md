# Unified Token Authentication

**Date:** December 2025

## Context

PRFC Outreach needs to authenticate two types of users:

1. **Admins** accessing the referral database
2. **Members** accessing Contact Groups

Both user types already have accounts in the PRFC member portal at pasofoodcooperative.coop/accounts/.

## Decision

Use a single token-based session for both user types, validated in two steps. The portal owns its own token format, and we do not reimplement it. On click-through the portal posts its token to `/api/auth/callback`, and the callback validates it by calling the portal's `validatetoken` endpoint, which returns the `ownerid`, the admin flag, and the seconds left. Delegating validation means this code never has to match the portal's signing, field order, or timestamp timezone, and a format change on the portal side does not break login.

On a valid response the callback mints the app's own session cookie, `prfc_auth`, and stores the raw portal token in a second cookie (`prfc_portal_token`) for the member-roster read.

**Session cookie format:**

```
ownerid|isAdmin|timestamp|hmac_signature
```

- Minted by the callback, not by the portal
- `isAdmin` flag differentiates access levels
- HMAC-SHA256 signature (the first 8 hex characters) over `ownerid|isAdmin|timestamp`, keyed with `PRFC_PORTAL_SECRET`, prevents tampering
- `timestamp` in epoch milliseconds, 60-minute expiry
- Set httpOnly, so client JavaScript cannot read it

**Validation:**

- The proxy (`src/proxy.ts`, renamed from middleware in Next.js 16) checks cookie presence as a fast UX redirect
- The DAL verifies the HMAC signature and expiry on every request (true security boundary), with no portal round-trip
- `requireAdmin()` gates admin-only features like the referral database

## Alternatives Considered

- **Separate password for admins**: Would require URL passwords or a separate login. The token already carries identity and role info.

- **OAuth/SSO**: Overkill. Members already authenticate with the PRFC portal.

- **Middleware-only auth**: CVE-2025-29927 showed middleware can be bypassed. DAL provides defense-in-depth.

## Consequences

**Benefits:**

- Single auth system to understand and maintain
- No duplicate logins, since the portal hands off the token directly
- `isAdmin` flag eliminates need for separate admin auth
- DAL pattern protects against middleware bypass

**Trade-offs:**

- Login depends on the portal's `validatetoken` endpoint being reachable and reporting the admin flag
- `PRFC_PORTAL_SECRET` must be coordinated with PRFC infrastructure, since the same secret signs the session cookie and the public referral `cs` parameter

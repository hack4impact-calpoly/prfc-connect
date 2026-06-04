# Architecture

PRFC Outreach is a Next.js application for the Paso Robles Food Co-op. It handles member referrals, contact groups, group and blast messaging, calendar events, and member notifications.

## System Diagram

<img src="figures/architecture.png" alt="Architecture diagram" width="900" />

## Tech Stack

| Layer         | Technology                            | Purpose                                    |
| ------------- | ------------------------------------- | ------------------------------------------ |
| Framework     | Next.js 16                            | App Router, server rendering               |
| UI            | React 19                              | Components                                 |
| Language      | TypeScript                            | Type safety                                |
| Database      | MySQL + Prisma 7                      | Data storage and ORM                       |
| Styling       | Tailwind CSS 3                        | Utility classes                            |
| Components    | shadcn/ui                             | UI primitives over Radix                   |
| Validation    | Zod                                   | Runtime type checking                      |
| Email         | Brevo                                 | Transactional email over REST              |
| SMS           | Twilio                                | A2P 10DLC SMS (disabled at launch)         |
| Rate limiting | Upstash Redis                         | Throttling, daily email quota, idempotency |
| Tables/lists  | @tanstack/react-table + react-virtual | Large referral and member tables           |
| Search        | fuse.js                               | Client-side fuzzy search                   |
| Calendar      | Schedule-X                            | Events week and month views                |

## Request Flow

<img src="figures/request-flow.png" alt="Request flow" width="300" />

## Layers

The code is organized in layers, each with one responsibility:

- **Pages** (`src/app/`) - server components fetch data and pass it to client components.
- **Actions** (`src/actions/`) - `"use server"` functions. They validate with Zod, call services, and return `ActionResult<T>`. Every action calls `verifySession()` first.
- **Services** (`src/services/`) - `import "server-only"`. Database access through Prisma. Never imported by client code.
- **Components** (`src/components/`) - UI. `"use client"` only when needed.
- **Types** (`src/types/`) - shared interfaces that cross layers. Isomorphic, no runtime code.
- **Schema** (`src/schema/`) - Zod schemas and their inferred types.
- **Lib** (`src/lib/`) - server integrations: db, dal, encryption, csrf, rate-limit, idempotency, API clients.
- **Utils** (`src/utils/`) - pure helpers and constants. Isomorphic.
- **Hooks** (`src/hooks/`) - generic shared hooks.

## Key Patterns

### Server Actions for Mutations

Group, message, event, and settings mutations use Server Actions, co-located with their features. A form calls an action, which validates with Zod, calls a service, and returns `{ success, error?, data? }`. See the [Server Actions ADR](decisions/server-actions.md).

### API Routes

API routes cover external integrations and reads, not the in-app group, message, and event mutations (those are server actions). Current routes:

| Endpoint                            | Method         | Purpose                                            |
| ----------------------------------- | -------------- | -------------------------------------------------- |
| `/api/referrals`                    | POST / GET     | Create a referral (public form) / list (admin)     |
| `/api/referrals/[id]`               | PATCH / DELETE | Update or delete a referral (admin)                |
| `/api/referrals/export`             | GET            | Server-side PDF export (admin)                     |
| `/api/members`, `/api/members/[id]` | GET            | Member lookups                                     |
| `/api/auth/callback`                | POST           | Accept a signed portal token, set the auth cookie  |
| `/api/auth/logout`                  | POST           | Clear the auth cookie                              |
| `/api/cron/process-email-queue`     | GET            | Drain the email queue (Vercel cron, Bearer secret) |
| `/api/sms/inbound`                  | POST           | Twilio inbound webhook (STOP handling)             |
| `/api/unsubscribe`                  | GET / POST     | Email unsubscribe                                  |

### Token Authentication

Login starts at the PRFC member portal. On click-through the portal hands a signed token to `POST /api/auth/callback`. The callback does not trust that token directly. It posts the token back to the portal's `validatetoken` endpoint, which returns the `ownerid`, the admin flag, and the seconds left. Validation is delegated to the portal, so this code never has to match the portal's exact token format, timezone, or signing.

On a valid response the callback mints the app's own session cookie, `prfc_auth`:

```
ownerid|isAdmin|timestamp|signature
```

- `ownerid` - member id from the portal
- `isAdmin` - `1` for admin, `0` otherwise
- `timestamp` - mint time in epoch milliseconds (60-minute expiry)
- `signature` - the first 8 hex characters of an HMAC-SHA256 over `ownerid|isAdmin|timestamp`, keyed with the shared `PRFC_PORTAL_SECRET`

Every later request validates this cookie in the DAL, so most requests need no portal round-trip. The callback also stores the raw portal token in a second cookie, `prfc_portal_token`, which the member-roster read (`listmembers`) sends back to the portal. The public referral URL carries the same 8-hex signature scheme in a `cs` parameter, over `name|email|code` with the same secret, verified before any referral is accepted.

### Routing and the Auth Boundary

Next.js 16 uses `src/proxy.ts`, not `middleware.ts`. The proxy checks for the auth cookie on protected paths and redirects when it is missing, which is a fast UX guard. The real security boundary is `verifySession()` in `src/lib/dal.ts`, which verifies the HMAC and expiry, and `requireAdmin()` gates admin-only features. See the [Auth Patterns ADR](decisions/auth-patterns.md).

## Data Model

The Prisma schema defines the app's tables. Referral PII and SMS/email PII are encrypted at the service layer with AES-256-GCM, alongside HMAC blind-index columns for lookup without decryption.

| Model                                         | Purpose                                                         |
| --------------------------------------------- | --------------------------------------------------------------- |
| `Referral`                                    | Public referral submissions (encrypted PII)                     |
| `ContactGroup`, `ContactGroupMember`          | Groups and membership with per-group notification preferences   |
| `Message`, `MessageGroup`, `MessageRecipient` | Message history and per-recipient delivery status               |
| `Event`, `EventInvitee`, `EventRsvp`          | Calendar events, invitations, and RSVPs                         |
| `SmsConsent`                                  | TCPA consent records (encrypted phone, blind index)             |
| `EmailSuppression`                            | Bounces, complaints, and unsubscribes (global suppression)      |
| `UserPreference`                              | Per-member notification defaults, photo, notification watermark |

Member identity (name, email, phone) lives in the co-op's MySQL `tblowner` table and is read through the member-portal API, not stored here. In local development it is backed by a 389-row mock in `src/lib/mock-members.ts`.

**Compliance:**

- SMS (TCPA + A2P 10DLC): explicit consent (timestamp, method, and text), quiet hours from 8 AM to 9 PM, and consent retention.
- Email (CAN-SPAM): one-click unsubscribe, a physical mailing address, and honored opt-outs.

## Security

- Field-level AES-256-GCM encryption for referral, SMS-consent, and email-suppression PII, with HMAC blind indexes.
- Nonce-based CSP and security headers set in `src/proxy.ts`.
- Rate limiting, idempotency keys, and a daily email quota through Upstash Redis (required in production).
- Origin checks and `verifySession()` on state-changing routes and actions.

## Related Docs

- [Getting Started](getting-started.md) - Local setup
- [Contributing](contributing.md) - Development workflow
- ADRs in `decisions/` - Why we made specific choices

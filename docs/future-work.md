# Future work

This file lists the work we deferred at launch. Each entry names what triggers it and where to start. Nothing here blocks production. We left each one for a reason, and that reason is written next to it.

## End-to-end test coverage

The e2e suite once drove the mock member portal, so when #222 removed that portal it took the feature-flow specs with it. The auth suite is back, because it now mints the session cookie programmatically instead of clicking through a fake login. The rest still needs rebuilding against the real flow.

Worth restoring, roughly in priority order: messaging, referral submission, email preferences, events, notifications, the SMS gate, and role-based sidebar visibility with collapse persistence. Each needs a green browser run behind it. A spec that only compiles does not exercise the flow. Start from `e2e/` and the auth setup in `playwright/.auth/`, which already shows the cookie-mint pattern to copy.

## Responsive and mobile

Every protected page renders at desktop width today. None has had its own responsive pass, and none ships a dedicated mobile viewport. So a phone user sees a desktop layout scaled down.

Take one page at a time. Audit it at a phone width, fix the layout, then add a mobile viewport to its e2e project so the breakpoint stays covered. The home, groups, messages, events, settings, and referral-database pages each need this.

## SMS

The SMS path is built and TCPA-compliant, but it is off at launch because `SMS_ENABLED` is unset. Turning it on is not a code change. It needs an A2P 10DLC campaign registered with the carriers, and that campaign ties to the co-op's legal entity, so it requires the legal name and EIN and takes a week or two to clear.

Once the campaign is approved, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, and `SMS_ENABLED=true`. The consent records, the STOP handling, and the rate limits are already in place.

## TanStack Table and the React Compiler lint rule

`eslint.config.mjs` turns off `react-hooks/incompatible-library`. The rule ships in the react-hooks recommended config and flags libraries that use interior mutability, and TanStack Table v8 is one of them. So we suppress it to keep `npm run lint` green over the data-table code.

The fix arrives with TanStack Table v9, which reworks the table around that pattern. But v9 is still alpha (`9.0.0-alpha.54` at last check) and the tracking issue, TanStack/table#5567, is still open. We stay on v8 (`8.21.3`) until v9 ships stable. When it does, upgrade the dependency, delete the three comment lines and the `"react-hooks/incompatible-library": "off"` line together, then confirm lint stays green.

## Tailwind v4

We run Tailwind v3. Its internals call Node's `url.parse`, which Node now marks deprecated (DEP0169), so the build prints a pending-deprecation warning. Tailwind v4 drops that call. The migration is real work, though, because v4 changes the config format and the directive syntax, so we left it for a focused pass rather than rushing it before launch. Note that `@tailwindcss/vite` already sits in `package.json` unused, and the v4 migration either wires it up or removes it.

## Dependency deprecation warnings

Three Node deprecation warnings print during build and test. None is ours, and each clears when the upstream package upgrades:

- DEP0169 (`url.parse`) from Tailwind v3, covered above.
- DEP0144 (`module.parent`) from Next's `next.config.ts` loader.
- The deprecated `scmp` package, pulled in transitively by twilio. It only loads when SMS runs, which is off at launch.

We see them, and they are safe to ignore until the owning package moves.

## Dependabot alerts

The repo shows a long list of Dependabot alerts, and almost all of them are stale. They target Next.js below 15 and a `mongoose` dependency, but we run Next 16 and carry no mongoose, so they do not apply. The one real finding was vitest below 4.1.0 (GHSA-5xrq-8626-4rwp, dev-only), which we already bumped past. So the count overstates the real exposure. Read each alert against the version we actually ship before acting.

## Production database constraints

The co-op runs the app against MariaDB 5.5.62, which sits below the version Prisma documents as supported. We tested it and it works. But three constraints follow from that version, and the next team should keep them in mind.

First, the schema is hand-created from our DDL with every `DATETIME(3)` changed to plain `TIMESTAMP`, so the production build drops `prisma migrate deploy` and there is no migration ledger on that server. Second, `TIMESTAMP` truncates sub-second precision and rejects dates past 2038-01-19, which is the column's ceiling. Third, the server has SSL disabled, so `DATABASE_URL` must not include `?ssl=true`. Add it and every connection fails with `ER_SERVER_SSL_DISABLED` and every database page returns 500.

## Repository access and handoff

This repo lives in the `hack4impact-calpoly` GitHub org, and GitHub does not let anyone self-assign admin. Each year, the Hack4Impact Cal Poly president adds the two incoming tech leads as admin collaborators on this repo.

The `develop` branch requires a reviewed pull request and a passing CI build to merge, and only repo admins can bypass that.

## Remaining co-op handoff items

Three operational items sit on the co-op's side, none of them in this codebase:

- The member portal's Referrals-tab link still points at the retired referral app and signs the `cs` parameter with the old scheme, so it errors when a member clicks it. Repoint it at the signed prfc-outreach referral URL.
- Profile photo upload needs a Vercel Blob store created in the project's Storage tab, which injects `BLOB_READ_WRITE_TOKEN`. Without it, uploads fail with "Vercel Blob: No token found."
- One test referral row remains in the production referral table and should be deleted.

The co-op owns the production accounts (the Vercel project, the MariaDB database, Brevo, Upstash). Their credentials and the account-ownership map stay outside version control, with the departing lead.

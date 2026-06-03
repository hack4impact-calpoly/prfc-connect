# Getting Started

This guide walks you through setting up PRFC Connect for local development.

## Prerequisites

- [Git](https://git-scm.com/)
- [fnm](https://github.com/Schniz/fnm) (Fast Node Manager)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VS Code](https://code.visualstudio.com/) (recommended)

### Install fnm

fnm manages Node.js versions. It reads the `.nvmrc` file and switches to the correct version automatically.

**macOS/Linux:**

```bash
curl -fsSL https://fnm.vercel.app/install | bash
```

**Windows:**

```powershell
winget install Schniz.fnm
```

After installing, restart your terminal and enable auto-switching:

```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
eval "$(fnm env --use-on-cd)"
```

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/hack4impact-calpoly/prfc-connect.git
cd prfc-connect
```

### 2. Install Node.js

fnm will read `.nvmrc` and install the correct version.

```bash
fnm install
fnm use
```

Verify you're on the right version:

```bash
node -v  # Should show v22.x
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Database

Start MySQL using Docker:

```bash
npm run docker:up
```

This starts MySQL on port 3306 and Adminer (database UI) on port 8080.

### 5. Set Up Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

The example fills in the database connection and feature flags for local dev. A few values are placeholders you must replace with real ones, or the app fails its startup validation:

- `FIELD_ENCRYPTION_KEY`, `BLIND_INDEX_KEY` - 64-character hex keys. Generate each with `openssl rand -hex 32`.
- `UNSUBSCRIBE_SECRET` - at least 32 characters. Generate with `openssl rand -base64 32`.

Email and SMS are off locally (`EMAIL_ENABLED=false`, `SMS_ENABLED=false`), and `USE_MOCK_MEMBER_API=true` uses the in-repo mock member list, so you do not need Brevo, Upstash, or portal credentials to run locally. `PRFC_PORTAL_SECRET` uses a dev fallback when unset.

### 6. Run Migrations

Set up the database schema:

```bash
npx prisma migrate dev
```

### 7. Start the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). You should see the public referral form.

**Logging in for protected pages is currently a gap.** The app gates protected pages (home, groups, events, messages) behind a signed portal session. The local mock-portal that used to mint dev tokens was removed during production hardening, and a human-facing local-login flow is not wired up yet. The e2e suite works around this by minting the `prfc_auth` session cookie directly in `e2e/auth.setup.ts`, so the authenticated tests still run, but there is no dev UI for a person to log in. Until one lands, you can run the public referral form locally, while reaching protected pages in a browser needs either a real portal click-through or a manually set session cookie. This is a known item for the next team.

## IDE Setup

Install these VS Code extensions:

- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

Enable format on save:

1. Open Settings (Cmd/Ctrl + ,)
2. Search "default formatter" -> select Prettier
3. Search "format on save" -> check the box

## Helpful Commands

**Development:**

- `npm run dev` - Start dev server at localhost:3000
- `npm run build` - Build for production
- `npm run lint` - Check code style
- `npm run lint:fix` - Auto-fix style issues
- `npm test` - Run tests

**Database:**

- `npm run docker:up` - Start MySQL container
- `npm run docker:down` - Stop MySQL container
- `npx prisma studio` - Open database GUI
- `npx prisma migrate dev` - Run migrations

## Project Structure

```
prfc-connect/
├── .github/           # GitHub Actions and templates
├── docs/              # Documentation
├── prisma/            # Database schema and migrations
├── public/            # Static assets
├── src/
│   ├── app/           # Next.js pages and API routes
│   ├── actions/       # Server Actions
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Server integrations (db, dal, rate-limit)
│   ├── schema/        # Zod validation schemas
│   ├── services/      # Business logic
│   ├── types/         # Shared cross-layer interfaces
│   ├── utils/         # Helper functions
│   └── proxy.ts       # Cookie gate for protected paths
└── test/              # Test files
```

## Troubleshooting

**Port 3306 already in use:**
Stop any existing MySQL process or change the port in docker-compose.yml.

**Prisma client errors:**
Regenerate the client:

```bash
npx prisma generate
```

**Node version mismatch:**
Make sure fnm is using the correct version:

```bash
fnm use
```

## Next Steps

Once your environment is running, read [Contributing](contributing.md) to learn the development workflow.

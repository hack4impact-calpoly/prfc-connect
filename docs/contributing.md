# Contributing

This guide covers everything you need to contribute to PRFC Connect.

## Prerequisites

Before contributing, make sure you have completed the [Getting Started](/docs/getting-started.md) guide and can run the app locally.

## Development Workflow

### 1. Start Fresh

Always start from an up-to-date `develop` branch.

```bash
git checkout develop
git pull origin develop
npm install
```

### 2. Create a Branch

Create one branch per issue, using a conventional-commit prefix and a short kebab-case description.

```bash
git checkout -b feat/export-button
```

Good branch names: `feat/export-button`, `fix/email-validation`, `docs/update-readme`

Bad branch names: `john-branch`, `fix`, `test123`

### 3. Make Changes

Write your code. Run the app locally to verify your changes work.

```bash
npm run dev
```

### 4. Check Your Work

Before committing, run the same checks that CI will run.

```bash
npm run lint        # Check code style
npm run build       # Verify production build
npm test            # Run tests
```

Fix any errors before continuing. Running `npm run lint:fix` will auto-fix most style issues.

### 5. Commit Your Changes

Stage and commit with a descriptive message following [conventional commits](https://www.conventionalcommits.org/).

```bash
git add .
git commit -m "feat: add PDF export button to referral table"
```

**Commit types:**

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `refactor:` code change that doesn't add feature or fix bug
- `test:` adding or updating tests
- `chore:` maintenance tasks

### 6. Push and Create PR

Push your branch and open a pull request.

```bash
git push -u origin feat/export-button
```

Go to GitHub, open a PR against `develop`, and fill out the template. Link your PR to the related issue by adding `Closes #123` in the description.

### 7. Code Review

Request a review from a tech lead. Address any feedback by pushing additional commits to your branch.

## CI/CD Pipeline

Every push and pull request runs automated checks through GitHub Actions.

**What runs:**

1. Install dependencies
2. Run database migrations
3. Lint code
4. Type check
5. Build the app
6. Run tests

This runs on Node 22.x.

**If CI fails:**

| Failure           | How to Fix                              |
| ----------------- | --------------------------------------- |
| Lint failed       | Run `npm run lint:fix` locally          |
| Type check failed | Run `npx tsc --noEmit` locally          |
| Build failed      | Run `npm run build` locally, fix errors |
| Tests failed      | Run `npm test` locally, check output    |

Always run checks locally before pushing to catch issues early.

## Security Notes

GitHub Dependabot and `npm audit` flag vulnerabilities in dependencies. They use different databases, so their alerts may differ. When either flags something, address it in a PR, usually a version bump. If a flag is a false positive for how we use the package, note the reasoning in the PR.

```bash
npm audit
```

## Code Review

**Who reviews:** Tech leads review all PRs.

**Timeline:** Expect feedback within 24 hours. If you haven't heard back, ping in Slack.

**What reviewers look for:**

- Code works and solves the issue
- No obvious bugs or security issues
- Code is readable
- Tests pass

Once approved, a tech lead will merge your PR.

## Questions?

Stuck on something? Ask in Slack before spending hours debugging alone.

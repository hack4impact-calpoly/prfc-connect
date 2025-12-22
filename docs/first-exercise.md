# First Exercise

Welcome to the team! This exercise gets you comfortable with the codebase and our workflow by creating your own team page.

## What You'll Build

A personal page at `/team/[yourlastname]` with:

- Your name and role
- A fun fact about you
- A button that counts clicks

## Before You Start

Make sure you've completed [Getting Started](getting-started.md) and can run the app locally.

## Step 1: Look at the Example

There's an existing team page you can use as reference:

- **Page:** `src/app/team/rutledge/page.tsx`
- **Test:** `test/team/rutledge.test.tsx`

Visit [http://localhost:3000/team/rutledge](http://localhost:3000/team/rutledge) to see it running.

## Step 2: Create Your Branch

```bash
git checkout develop
git pull origin develop
git checkout -b add-team-page-[yourlastname]
```

## Step 3: Create Your Page

Create your page file at `src/app/team/[yourlastname]/page.tsx`.

Your page should include:

1. Your name and role (similar to the example)
2. A fun fact section
3. A button that tracks how many times it's been clicked

**Documentation:**

- [React useState](https://react.dev/reference/react/useState) - managing state for your click counter
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components) - required when using React hooks
- [Tailwind CSS](https://tailwindcss.com/docs) - styling reference

## Step 4: Create Your Test

Create a test file at `test/team/[yourlastname].test.tsx`.

Your tests should verify:

1. Your name renders on the page
2. Your role renders on the page
3. The fun fact section exists
4. The counter increments when the button is clicked

**Documentation:**

- [Vitest](https://vitest.dev/guide/) - Vitest testing fundamentals
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - testing React components
- [Next.js: Testing with Vitest](https://nextjs.org/docs/app/guides/testing/vitest) - Next.js specific setup

Refer to `test/team/rutledge.test.tsx` to see the testing patterns used in this project.

Run your tests:

```bash
npm test -- team/[yourlastname]
```

## Step 5: Update the README

Add yourself to the team list in `README.md` under the Developers section, following the existing format.

## Step 6: Verify Everything Works

```bash
npm run lint
npm run build
npm test
```

All checks should pass before you push.

## Step 7: Commit and Push

```bash
git add .
git commit -m "feat: add team page for [yourlastname]"
git push -u origin add-team-page-[yourlastname]
```

## Step 8: Create a Pull Request

1. Go to the repository on GitHub
2. Click "Compare & pull request"
3. Fill out the PR template
4. Request a review from a tech lead

## Done!

Once your PR is merged, you've completed onboarding. You now know how to:

- Create React components with hooks
- Write tests with Vitest and React Testing Library
- Follow the contribution workflow

Stuck? Ask in Slack.

# PropFusion automated tests — install and run

This patch is based on the provided `sprint-04-main 2.zip` (November 2026). Copy its files over the corresponding paths in your **current** project. No app code or production DB is changed by this patch.

## 1. Install test development dependencies

```bash
npm install --save-dev vitest @vitest/coverage-v8 @playwright/test
npx playwright install chromium
```

These commands update `package.json` and `package-lock.json` on your machine. Keep those updated files together when committing. The patch adds test script names but intentionally does not fabricate a new lockfile without an actual npm install.

## 2. Run tests

```bash
npm run test:unit        # unit tests only
npm run test:integration # mocked MongoDB/auth/email integrations
npm run test             # unit + mocked integration
npm run test:coverage    # focused coverage for selected business helpers
npm run test:e2e         # launches localhost:3000 dev server + Chromium
```

For browser tests, use your existing local development environment, or make a separate **non-production** environment. They do not create users or payments. Playwright will use your already running local server if there is one, or start one on port 3000.

## 3. Interpretation
- All integration tests mock the DB/auth/email integrations; they are **not real Atlas tests**.
- The payment partial-write test documents the current failure mode; skipped concurrency test remains a known gap.
- Automated tenant invite acceptance, fully authenticated E2E flows and real DB integrity tests still require a dedicated sandbox test database and test fixtures.
- If tests expose failures, keep the failing test; repair application code or review the test expectation against product requirements.

## Troubleshooting
- Vitest cannot find module: run `npm install` and ensure you copied `vitest.config.ts` into the project root.
- Playwright missing browser: run `npx playwright install chromium`.
- Browser cannot load app: ensure `.env.local` has DEVELOPMENT values and that `npm run dev` works.
- Browser tests refuse your URL: only `http://localhost:3000` or `http://127.0.0.1:3000` are allowed by design.
- If you have uncommitted work, back up `package.json` before merging the test scripts.

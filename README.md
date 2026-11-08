# PropFusion — Asset and Property Management

PropFusion is a **portfolio/demo full-stack SaaS application** for managing real-estate and agricultural assets, leases, tenants, transactions, reporting and a simulated tenant rent-payment workflow. Built with Next.js 16, React 19, TypeScript, MongoDB, Better Auth and Tailwind CSS.

> **Status:** Source-reviewed but not end-to-end tested in this deliverable. Deployed tenant login was reported returning HTTP 500 on 2026-11-08. Payment entry is a simulation, not a real bank/card charge.

## Features and routes

- Public landing, registration, manager/tenant sign-in, password reset, verification and 2FA
- Manager dashboard and portfolio selection
- Agricultural lands (`/dashboard/agriculture`) and real-estate properties (`/dashboard/realestate`): asset CRUD/details
- Lease/tenant management (`/dashboard/leases`) with invitation and tenant access
- Tenant portal (`/tenant/dashboard`) including simulated rent payments, receipts and support requests
- Transactions, dashboard analytics, audit trail, reporting and PDF/CSV exports
- Account profile, settings and notifications

Read `docs/PROPFUSION-AUDIT-2026-11-08.md` for detailed feature-by-feature inventory, observed-vs-intended behavior, redundancy findings, database risks and remediation plan.

## Local development

```bash
npm ci
cp .env.example .env.local  # fill in local values; do not commit secrets
npm run dev
```

Check with `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Keep Codespaces preview ports private and use an isolated development MongoDB database.

Key configuration: `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. See `.env.example`. Verify actual requirements in code before deploying.

## Database safety

`npm run db:audit` is **read-only**; it prints collection counts, indexes and cross-collection consistency checks using `.env.local`. Do not post its complete output publicly if it contains internal database naming details.

`db:reset-sprint4` **deletes ALL documents** in multiple business collections. It is blocked unless an explicit opt-in environment variable is provided, and must never be used with a production database. Prefer a disposable local database and documented seed migrations.

## Production troubleshooting

For the reported login HTTP 500, inspect the failing Network request and matching Vercel runtime log. Verify database connectivity, `BETTER_AUTH_URL`, trusted origins, and Better Auth initialization. Never paste credentials, cookies or tokens into issues.

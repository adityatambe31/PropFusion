# PropFusion — Technical Audit, Feature Inventory and Database Cleanup Plan
**Audit date:** 2026-11-08  
**Baseline:** user-supplied `sprint-04-main.zip` (source snapshot dated 2026-08-07); cleanup v1 plus this second safe pass.  
**Verification level:** static source-code review; no live database access, no production log access, no successful end-to-end test. A deployed tenant sign-in produced an HTTP 500 according to user's browser screenshot.

## Executive findings

PropFusion is intended as a portfolio/demo SaaS for managing real estate and agricultural assets with manager and tenant experiences, lease management, transactions, visual analytics, exports, email flows and simulated rent payments. The source contains those modules. It is **not yet demonstrated production-ready**. The existing `README.md` in the August snapshot described a separate personal-finance app with Ollama/account import features; it was outdated. The main implementation risks are brittle authentication/domain configuration, hardcoded role exceptions for demo accounts, demo-data mutation of persistent collections, non-atomic payment writes, missing demonstrated uniqueness constraints, large tightly coupled pages, and insufficient regression testing.

### What was changed in this deliverable
- Retained v1's shared `lib/db/assets-db.ts` helper for the land/property API routes.
- Removed `lib/db/lease-db.ts`: duplicate predecessor of `lib/db/leases-db.ts`; no source imports referenced the former (verified within `app`, `lib`, `components`).
- Replaced stale README with accurate property-management overview and development/database safety notes.
- Added `.env.example` with placeholders only, never secrets.
- Added read-only `scripts/audit-db-readonly.mjs` and `npm run db:audit`.
- Added explicit destructive-operation opt-in to `scripts/reset-sprint4-data.mjs`; also refuses when `NODE_ENV` or `VERCEL_ENV` is `production`. **Important:** this is a safety aid, not sufficient protection if someone points a development script at a production URI. Treat the reset script as hazardous and do not use on a database with valued records.
- No production DB collections, accounts, hosting settings, or deployed application were modified.

## Feature-by-feature audit

**Status definitions:** *Implemented in source* = code/path exists; *Reported broken* = user demonstrated failure; *Unverified* = no successful functional run was performed. These labels do not certify correctness/security.

| Feature | Relevant source | Current implementation | Intended function | Status / needed cleanup |
|---|---|---|---|---|
| Public landing & navigation | `app/page.tsx` | Marketing landing page with product messaging and navigation | Introduce platform, direct new users to sign up or sign in | Implemented in source; inspect nonfunctional demo/search/request widgets |
| Sign-up and sign-in | `app/auth/*`, `app/tenant/sign-in/page.tsx`, `lib/auth/auth.ts`, `app/api/auth/[...all]/route.ts` | Better Auth email/password account flows and UI | Reliable login for managers and tenants | **Reported broken** on deployed tenant login (HTTP 500); determine failing endpoint, runtime stack trace, MongoDB handshake and base URL |
| Verification, password reset and 2FA | `app/auth/verify-email`, `forgot-password`, `reset-password`, `account/verify-2fa`, `components/auth/CustomTwoFactorCard.tsx` | Verification/reset email templates and 2FA plug-in | Recover accounts, verify emails and optional second-factor security | Implemented in source; test email credentials, callbacks, secret stability, expired tokens and redirects |
| Roles, session and isolation | `lib/auth/access.ts`, `lib/auth/user-record.ts`, `proxy.ts`, `app/api/auth/user-access/route.ts` | Manager/tenant/admin role lookup, tenant/lease mapping, route checks | One user's data inaccessible to others, secure onboarding | Implemented in source; high-priority hardcoded demo emails, side effects during role lookup, default-manager fallback; systematic authorization tests required |
| Manager portfolio/dashboard | `app/onboarding/select-portfolio`, `app/dashboard/page.tsx`, `components/dashboard/*` | Portfolio selection, cards, charts and summary metrics | Consolidated asset performance overview | Implemented; confirm metrics derived from persisted data rather than seeded UI values |
| Agriculture asset CRUD | `app/dashboard/agriculture/*`, `app/api/lands/*`, `lib/hooks/useLands.ts` | Create/read/update/delete land assets, detailed attributes, sample seeding | Manage agricultural properties and associated records | Implemented; remove implicit production seeding after migration, validate inputs, split large page |
| Real-estate asset CRUD | `app/dashboard/realestate/*`, `app/api/properties/*`, `lib/hooks/useProperties.ts` | Create/read/update/delete real-estate records, tenant snapshots, sample seeding | Manage buildings/units, occupancy and valuations | Implemented; same seeding and validation concerns; extract common forms |
| Lease management | `app/dashboard/leases/*`, `app/api/leases/*`, `lib/db/leases-db.ts` | Create/edit/lookup leases, associated tenants and properties, computed status, populated records | Consistent lease lifecycle, tenant-linked records | Implemented; validate ownership and referential integrity; consolidate status/time handling |
| Tenant invites & onboarding | `app/api/tenant/accept-invite`, `app/tenant/accept-invite/*`, `lib/db/tenant-invite.ts` | Invite-token workflow and linking account to lease | Invite intended tenant securely without cross-portfolio access | Implemented; audit expiration, token hashing, re-use, email normalization and tenant uniqueness |
| Tenant dashboard | `app/tenant/dashboard`, `app/api/tenant/dashboard` | Tenant-facing lease/rent details and history | Restricted self-service access | Implemented; end-to-end test after auth repair |
| Rent payment simulation | `app/tenant/dashboard`, `components/tenant/PayRentModal.tsx`, `app/api/payments`, `lib/db/payment.ts` | Demo payment records, rent history update and financial transaction creation; no real payment processing | Predictable demo-only payment flow and duplicate prevention | Implemented; **not live payments**; enforce uniqueness atomically and make multi-collection writes transactional/idempotent |
| Receipts | `app/api/payments/[id]/receipt`, `lib/email.ts` | Receipt rendering/download and email integrations | Reliable downloadable receipts and optional emails | Implemented; verify payment ownership, authorization, template escaping and generated artifacts |
| Transactions / analytics | `app/api/transactions/*`, `lib/db/transaction.ts`, dashboard chart components | Revenue/expense creation and KPI charts | Financial reporting and filtering | Implemented; ensure consistent amount types, currency handling and correct joins/aggregations |
| Reports / exports | `app/dashboard/reports`, agriculture/realestate report pages, `app/api/export/*`, `lib/export/*`, `components/dashboard/ReportPDF*` | Report dashboards and PDF/CSV generation | Consistent manager-readable financial statements and downloads | Implemented; duplicated report UI; test large files, formulas, selected-export authorization, browser download |
| PDF parsing | `app/api/parse-pdf`, `lib/parsers/unified-parser.ts` | Parsing tools for extracting document/transaction information | Assist imports/document processing | Implemented in source; test limits, file validation, OCR behavior and third-party API dependency |
| Tenant support | `app/tenant/support`, `app/api/tenant/support` | Support request storage, acknowledgment and manager email | Tenant support tickets and communication | Implemented; isolate ticket access, define management UI/closure workflow, handle email failures gracefully |
| Audit logging | `app/dashboard/admin/audit`, `app/api/audit`, `lib/db/audit.ts`, `lib/middleware/audit-logger.ts` | App-level audit events and viewer | Trace changes for authorized administrators | Implemented; verify every sensitive mutation logged and manager/admin access enforcement |
| Account/profile/settings | `app/dashboard/account/*`, `lib/auth/auth.ts` | Profile, settings, password/email/account operations | Self-service account management | Implemented; end-to-end tests for sensitive changes, emails and session invalidation |
| Notifications | `components/dashboard/NotificationPanel.tsx`, `lib/helpers/notification-helpers.ts` | Notification display and helper logic | Useful alerts for tenant/lease status | Implemented; distinguish persistent notifications from computed/static ones |
| CI/QA/deployment | `package.json`, `docs/qa-report.md` | npm scripts and QA checklist template; no completed test evidence in QA report | Repeatable checks and safe staged deployment | **Unverified**; automate checks and gather test evidence before production release |

## Observed vs designed: evidence-based statements

**Observed on deployed environment:** sign-in page rendered; tenant flow emitted a 500 toast. The screenshot alone cannot distinguish sign-in endpoint from post-login role/session fetch. No other production workflow was verified.

**Source behavior:** the application includes landing, manager dashboards, agricultural and real-estate assets, leasing, tenant portal, simulated rent payments, email templates, exports, audit logs, report pages. Some asset listing requests insert demo records automatically when none exist; this can make "empty" portfolios appear prepopulated and must be decided as an explicit product requirement instead.

**Intended target:** a maintainable property/asset demo SaaS with correct tenant isolation, account flows, repeatable local setup, non-destructive DB migrations, reliable payments simulation, reproducible tests and accurate documentation. Not a production financial processor.

## Redundancy and maintainability audit

| Finding | Evidence | Risk | Action |
|---|---|---|---|
| Duplicate lease data modules | `lib/db/lease-db.ts` and `lib/db/leases-db.ts` had near-identical types, formatting, status, population/snapshot logic; only plural module imported | Divergence, unclear source of truth | **Done:** deleted unused singular module; keep plural version |
| Duplicate land/property CRUD boilerplate | `app/api/lands/route.ts` and `app/api/properties/route.ts` repeat list-or-seed, insert and response conversion | Maintenance duplication | **Done in v1:** shared `lib/db/assets-db.ts`; still need route-level validation, update/delete review |
| Very large client UI pages | Agriculture page ~75 KB; real-estate page ~64 KB; landing ~47 KB; report page ~45 KB | Hard testing, tangled state, repeated forms | Extract domain-specific forms into `components/assets`, shared fields/formatters, hooks and section components; snapshot UI first |
| Repeated report layout / exports | Real-estate and agriculture report pages, multiple `lib/export/*` utilities | Divergent exports | Shared report shell, charts and reusable KPI widgets; keep domain-specific formulas isolated |
| Demo accounts embedded in access rules | `lib/auth/user-record.ts`, `lib/auth/access.ts` | Privilege assumptions tied to email, fragile tenant mapping | Replace with explicit invite/admin assignment; never auto-promote based on email in deployed app |
| Auth MongoDB connection setup duplicated | `lib/auth/auth.ts` and `lib/db/mongodb.ts` both build MongoDB clients | Connection lifecycle inconsistency; potential resource waste | Establish one shared initialized client / DB provider; test Better Auth adapter after change |
| Inconsistent data representation | Monetary strings in seeded property documents but numeric payments; ISO strings for timestamps | Calculation, validation, migration headaches | Normalize currency and monetary amount to number of integer minor units; choose timestamps consistently |
| Hardcoded deployment fallback | `lib/url.ts` references historical Sprint 2 hostname | Wrong callbacks/trusted origins on new domains | Require explicit canonical URL in production and validate redirects |
| No demonstrated completed CI tests | `docs/qa-report.md` is a template with TBD sections | Regressions during cleanup | Add automated API/domain tests and CI pipeline, then fill QA report with evidence |
| Dependencies need usage audit | package lists AI, OCR, SQLite, PDF, map and UI libraries | Bundle, build and security overhead | Search imports before removal; remove unused packages only with lockfile regen and successful build |

## MongoDB collections and relationships

Collections inferred from source: `user`, `session`, `account`, `verification` (Better Auth), `properties`, `lands`, `leases`, `tenants`, `tenantInvites`, `transactions`, `payments`, `auditLogs`, `supportRequests`. **Live collection names/indexes may differ; verify with the read-only script.**

Typical relationships: `properties.userId` -> manager auth user; `leases.userId` -> manager; `leases.propertyId` -> `properties.id`; `leases.tenantId` -> `tenants.id`; `leases.tenantAuthUserId` -> tenant auth user; `payments.leaseId` -> `leases.id`; `transactions.paymentId` -> `payments.id`; `supportRequests.leaseId` -> lease.

### Database risks / cleanup actions (do in this order)
1. **Backup and isolate:** take a consistent snapshot/export of the live DB; restore into an isolated development DB. Restrict credentials and network access. Confirm restore by querying counts before modifying anything.
2. **Read-only baseline:** run `npm run db:audit` against an authorized replica; capture counts, existing indexes, duplicate rent-period counts and broken lease references. Do not paste personal data or URIs into chat.
3. **Define schemas:** explicit TypeScript types and runtime request validators for assets, tenants, leases, payments and support tickets. Align ID formats, created/updated timestamps, numeric monetary values and normalized email addresses.
4. **Indexes (proposals, not executed):** `user.email` unique managed via Better Auth; `properties`/`lands` `{userId:1,id:1}` unique where appropriate; `leases` `{userId:1,id:1}` unique, plus `tenantAuthUserId`, `propertyId`; `tenantInvites` token hash unique and expiry index after retention review; `payments` `{leaseId:1,period:1}` unique **only for paid records with validated period** (partial unique index), `transactions.paymentId` indexed; `auditLogs` actor/timestamp indexes. Inspect actual duplicates first: adding a unique index can fail on preexisting data.
5. **Financial integrity:** one transaction/session for payment insert + lease history update + financial transaction OR a well-defined idempotent event/outbox workflow. Transactions need a compatible MongoDB deployment and error handling. Do not store real card numbers; only masked last four, and clearly label the system simulated.
6. **Remove unsafe auto-seeding:** seed sample records through an explicit, non-production command; never automatically insert defaults on a GET request. Migration should preserve existing users' records and be tested on a backup first.
7. **Repair references:** audit orphaned leases/tenants/properties/payments, stale invitation links, inconsistent roles and malformed dates. Prepare migration plans with dry-run counts, rollback and logs. Do not delete orphaned records blindly; they may represent recoverable customer history.
8. **Separate DB environments:** dev/staging/prod credentials, least-privilege DB user, secret rotation, backup scheduling, alerting and retention policy. Use `MONGODB_DB_NAME` consistently only after testing; currently app code hardcodes `propfusion`.
9. **Retire destructive reset:** the current test seed script deletes whole collections and session records for specified demo users. This is not a cleanup/migration tool; keep out of production and eventually replace with separate explicit seed and migration tooling.

### Read-only audit run
```bash
# Setup .env.local with MONGODB_URI pointing to a permitted, preferably restored replica
npm ci
npm run db:audit
```
The script enumerates known collection counts and indexes and reports invalid references/duplicate paid periods in aggregate. It does **not** delete/modify records. For sensitive datasets, review audit output before sharing.

## 500 login investigation (priority before feature deployments)
1. From browser DevTools Network, identify the precise failing `/api/...` path, status and redacted response. A toast alone is insufficient.
2. Locate corresponding Vercel runtime exception, stack trace and request ID. Do not disclose secrets.
3. Verify env config on the right deployment: `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, allowed origins. Check MongoDB Atlas IP/network/access and driver compatibility.
4. Review `lib/auth/auth.ts`: it creates a MongoClient and obtains `client.db()` before connection completion; Better Auth can await operations, but driver/client lifecycle merits inspection. Compare with `lib/db/mongodb.ts` global promise and consolidate under tests.
5. Check tenant `getAccessContext` and invitations; note it performs writes during role resolution and has hardcoded demo role exceptions. If sign-in succeeds but `user-access` fails, inspect these paths.
6. Verify manager and tenant accounts separately in an isolated test database; include no-email / expired-token / bad-password / unverified email / tenant without lease scenarios.
7. Only after root cause established: patch, test preview deployment, and promote to production.

## Proposed phased refactor / rollout

**Phase 0 (now):** baseline inventory, protected source branch, backup, readonly DB audit and login log collection.

**Phase 1 (P0):** fix auth 500; correct trusted origins/env handling; remove hardcoded production role assignments; negative authorization tests for tenants/managers.

**Phase 2 (P0):** idempotent atomic simulated rent payments; prevent duplicate paid lease-period; fix data relationships, validation and authorization of receipts/exports; introduce non-destructive DB migrations.

**Phase 3 (P1):** extract giant pages into reusable components and hooks; unify duplicated reports and API error handling; remove unnecessary dependencies only after import audit; standardize types and dates.

**Phase 4 (P1):** test suites for auth, asset CRUD, leases, tenant isolation, payments, exports and email; CI gates (`npm ci`, lint, typecheck, build, tests); QA evidence in Chrome, Safari, desktop/mobile.

**Phase 5:** README architecture diagrams, example dataset, safe setup guide, GitHub repo screenshots, preview release, production rollout with rollback plan.

### Acceptance checklist
- [ ] No 500 on manager/tenant login, with valid/invalid input tests
- [ ] Tenant cannot access other tenant/manager data through endpoints
- [ ] Empty new portfolio remains empty unless user explicitly opts into demo data
- [ ] Asset/lease/transaction CRUD tested with validation and access checks
- [ ] One simulated payment per paid lease-period, even under concurrent requests
- [ ] Payment, receipt, lease history and transaction stay consistent
- [ ] Read-only DB audit is clear or reviewed and migrations tracked
- [ ] Lint/typecheck/build/tests pass in Codespaces/CI
- [ ] Docs, environment setup, privacy and simulation disclaimers accurate
- [ ] No protected or production data accidentally reseeded, erased or exposed

## Verification limitations

No `MONGODB_URI`, credentials, linked DB, production logs, or working dependency installation was available during this audit. Therefore no migrations/indexes were executed, login was not repaired, and static inventory must not be confused with a successful functional test. **Do not deploy this archive straight to production without validation.**

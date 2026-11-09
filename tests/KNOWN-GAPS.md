# PropFusion automation coverage and known gaps

## Confirmed implementation targets
- Unit: report formulas, monthly/annual expense and ROI, lease status and date calculations, invitation token hashing.
- Integration with mocked database/services: asset ownership, demo-data seeding, lease payment persistence, duplicate-paid checks, payment route authorization and input validation, receipt access and HTML escaping.
- Playwright (local browser): public login role selection, tenant redirect, anonymous route guards.

## NOT yet end-to-end tested
- Completing manager registration / email verification / 2FA with browser accounts.
- Tenant invitation acceptance with a real isolated MongoDB instance.
- Lease creation persisted to an isolated MongoDB instance.
- Authenticated manager -> tenant -> rent -> receipt full browser flow.
- PDF and CSV exports beyond calculator tests.
- Actual database schema/index constraints, migrations and cleanup.

## Known implementation risks (do not hide these failures)
1. `lib/db/payment.ts` checks for an existing record *before* insertion. Parallel payment requests could both pass without a unique `{leaseId,period,status}` database constraint. There is a skipped concurrency regression test; this behavior needs a fix before enabling it.
2. `createRentPayment` updates `payments`, `leases` and `transactions` without a MongoDB transaction. The current test DOCUMENTS that a failed final write leaves prior writes completed; it does not certify integrity.
3. `GET /api/lands` and `/api/properties` intentionally seed demo data when the user has no assets. Tests currently preserve that legacy behavior, not endorse it as production design.
4. The invitation acceptance route updates multiple collections concurrently without a transaction; race conditions and email-ownership validation require hardening.
5. Current receipt endpoint returns print-friendly HTML, not an actual generated PDF binary.
6. Security checks with mocked session/database dependencies do not replace full integration testing with real Better Auth and MongoDB.

## Safety
- No test contacts Resend, Atlas or Vercel. Integration tests are mocks; E2E public-route tests are intentionally read-only.
- Do not point E2E at production. The Playwright config rejects non-localhost base URLs.
- `.env.local` remains yours; it is not included in this test package.

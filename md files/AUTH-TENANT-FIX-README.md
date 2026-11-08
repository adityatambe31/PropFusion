# PropFusion Tenant Authentication Fix

This version fixes the Sprint 4 tenant flow by:

- repairing accepted invite links automatically using the authenticated email;
- linking `user`, `tenantInvites`, and `leases` records;
- allowing the tenant dashboard to locate older partially-linked leases;
- redirecting `/tenant` to `/tenant/dashboard`;
- preventing tenant accounts from rendering the manager dashboard;
- showing the real API error instead of a generic message.

## Test

1. Run `npm install`.
2. Run `npm run dev`.
3. Keep the manager in a normal browser window.
4. Open an Incognito window for the tenant.
5. Accept the tenant invitation using the exact invited email.
6. Sign in using **Tenant**.
7. Open `http://localhost:3000/api/auth/user-access` and confirm `role` is `tenant`.
8. Open `http://localhost:3000/tenant/dashboard`.

Do not use two normal tabs for manager and tenant because they share the same authentication cookie.

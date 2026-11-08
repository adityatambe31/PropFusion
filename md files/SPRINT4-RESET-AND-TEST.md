# Sprint 4 clean reset and test

This repository is configured for these two accounts:

- Property manager: `aditya.tambe.professional31@gmail.com`
- Tenant: `tambeaditya22@gmail.com`

## Important

The reset script preserves Better Auth accounts and passwords. Both accounts must already exist once in the `user` collection. If either account is missing, sign it up and verify it first.

## Run

```bash
npm install
npm run db:reset-sprint4
rm -rf .next
npm run dev
```

The reset command deletes old records from `properties`, `lands`, `leases`, `tenants`, `tenantInvites`, `transactions`, `payments`, and `auditLogs`. It then creates one linked property, tenant, active lease, payment, and financial transactions.

It also enforces:

- manager email → `role: manager`
- tenant email → `role: tenant`
- tenant user → seeded lease and tenant IDs
- lease → tenant Better Auth user ID

## Verify

Use a normal browser for the manager and an Incognito window for the tenant.

Manager: `http://localhost:3000/auth/sign-in?role=manager`

Tenant: `http://localhost:3000/auth/sign-in?role=tenant`

Tenant API check: `http://localhost:3000/api/auth/user-access`

Expected tenant role:

```json
{"role":"tenant","leaseId":"...","email":"tambeaditya22@gmail.com"}
```

Tenant dashboard: `http://localhost:3000/tenant/dashboard`
